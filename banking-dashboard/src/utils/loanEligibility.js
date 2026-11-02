/**
 * Pure loan eligibility checker.
 * No React, no side effects — safe to use in tests and in components.
 *
 * @param {object} user   - User object from users.json
 * @param {object} loan   - Product object (category === "loan") with eligibility sub-object
 * @param {string} [userStatus] - The user's current status for this loan ("Active"|"Pending"|undefined)
 * @returns {{ result, checks, maxAmount, indicativeRate, estimatedEmi }}
 */

import { formatINR, formatLakh } from "./format.js";
import { calculateEmi } from "./emi.js";

// ---------- EMI formula helper delegating to pure calculateEmi ----------
function calcEmi(principal, annualRatePct, tenureMonths) {
  return calculateEmi(principal, annualRatePct, tenureMonths).emi;
}

// ---------- Parse the "Amount up to" from products.json (fallback) ----------
function parseMaxAmountFromProduct(loan) {
  if (typeof loan.sortLimit === "number") return loan.sortLimit;
  const metric = (loan.metrics || []).find((m) =>
    m.label.toLowerCase().includes("amount")
  );
  if (!metric) return Infinity;
  const cleaned = metric.value.replace(/[₹,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? Infinity : num;
}

// ---------- Parse the "Interest rate from" metric (fallback) ----------
function parseBaseRate(loan) {
  if (typeof loan.sortRate === "number") return loan.sortRate;
  const metric = (loan.metrics || []).find((m) =>
    m.label.toLowerCase().includes("interest rate")
  );
  if (!metric) return 8;
  const match = metric.value.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 8;
}

// ---------- Credit score band label ----------
export function scoreBandLabel(score) {
  if (score === null || score === undefined) return "No history";
  if (score >= 750) return "Excellent";
  if (score >= 700) return "Good";
  if (score >= 650) return "Fair";
  return "Poor";
}

// ---------- Repayment burden (FOIR) ----------
export function foirPct(existingEmi, newEmi, income) {
  if (!income || income <= 0) return 100;
  return (((existingEmi || 0) + (newEmi || 0)) / income) * 100;
}

// ---------- Main export ----------
export function checkLoanEligibility(user, loan, userStatus) {
  const el = loan.eligibility;
  if (!el) {
    return {
      result: "not_eligible",
      checks: [{ id: "no-rules", label: "Eligibility rules", pass: false, detail: "No eligibility rules found." }],
      maxAmount: null,
      indicativeRate: null,
      estimatedEmi: null,
    };
  }

  const baseRate = parseBaseRate(loan);
  const productMaxAmount = parseMaxAmountFromProduct(loan);
  const tenure = el.tenureMonths || 0;
  const minLoanAmount = el.minLoanAmount || 0;

  // Rate adjustment by credit score
  let rateAdj = 0;
  if (user.creditScore === null || user.creditScore === undefined) {
    rateAdj = 1.5; // no history → treat as sub-680
  } else if (user.creditScore >= 780) {
    rateAdj = 0;
  } else if (user.creditScore >= 720) {
    rateAdj = 0.5;
  } else if (user.creditScore >= 680) {
    rateAdj = 1.0;
  } else {
    rateAdj = 1.5;
  }

  const isCoApp = !!el.coApplicantAssumed;
  const indicativeRate = isCoApp ? baseRate : baseRate + rateAdj;

  // "already_holds" short-circuit
  if (userStatus === "Active" || userStatus === "Pending") {
    return {
      result: "already_holds",
      checks: [],
      maxAmount: null,
      indicativeRate,
      estimatedEmi: null,
    };
  }

  let maxAmount = 0;
  let estimatedEmi = 0;
  let foirCap = 0;

  if (isCoApp) {
    // When coApplicantAssumed: skip income, credit score, foir checks, cap maxAmount at product's Amount up to
    maxAmount = productMaxAmount;
    estimatedEmi = Math.round(calcEmi(maxAmount, indicativeRate, tenure) / 100) * 100;
  } else {
    // Standard calculation
    const monthlyIncome = user.monthlyIncome || 0;
    const existingEmi = user.existingEmi || 0;
    const incomeMultipleCap = el.incomeMultiple > 0 ? el.incomeMultiple * monthlyIncome : productMaxAmount;

    // Available room for new EMI under 50% FOIR limit
    const maxNewEmi = monthlyIncome > 0 ? (monthlyIncome * 0.5 - existingEmi) : 0;

    if (maxNewEmi > 0 && tenure > 0 && indicativeRate > 0) {
      const r = indicativeRate / 12 / 100;
      const n = tenure;
      foirCap = maxNewEmi * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n)));
    } else {
      foirCap = 0;
    }

    const rawMax = Math.min(productMaxAmount, incomeMultipleCap, foirCap);
    maxAmount = Math.max(0, Math.round(rawMax / 100) * 100);
    const estimatedEmiRaw = calcEmi(maxAmount, indicativeRate, tenure);
    estimatedEmi = Math.round(estimatedEmiRaw / 100) * 100;
  }

  // ---------- Run checks ----------
  const checks = [];

  // 1. KYC
  const kycPass = user.kyc === "Verified";
  checks.push({
    id: "kyc",
    label: "KYC verified",
    pass: kycPass,
    detail: kycPass ? "KYC is verified." : "KYC status is " + user.kyc + ". Must be Verified.",
  });

  // 2. Minimum age
  const agePass = user.age >= el.minAge;
  checks.push({
    id: "age",
    label: "Minimum age",
    pass: agePass,
    detail: agePass
      ? "Age " + user.age + " meets the minimum of " + el.minAge + "."
      : "Age " + user.age + ", needs " + el.minAge + " or above.",
  });

  // 3. Age at loan end
  const ageAtEnd = user.age + tenure / 12;
  const ageEndPass = ageAtEnd <= el.maxAgeAtMaturity;
  checks.push({
    id: "age-end",
    label: "Age at loan end",
    pass: ageEndPass,
    detail: ageEndPass
      ? "Age at maturity " + Math.ceil(ageAtEnd) + " is within limit of " + el.maxAgeAtMaturity + "."
      : "Age at maturity would be " + Math.ceil(ageAtEnd) + ", limit is " + el.maxAgeAtMaturity + ".",
  });

  // 4. Monthly income
  if (isCoApp) {
    checks.push({
      id: "income",
      label: "Monthly income",
      pass: true,
      detail: "Co-applicant assumed; income check not required.",
    });
  } else {
    let incomePass = true;
    let incomeDetail = "Income check not required.";
    if (el.minMonthlyIncome > 0) {
      incomePass = (user.monthlyIncome || 0) >= el.minMonthlyIncome;
      incomeDetail = incomePass
        ? "Monthly income " + formatINR(user.monthlyIncome || 0) + " meets the minimum of " + formatINR(el.minMonthlyIncome) + "."
        : "Monthly income " + formatINR(user.monthlyIncome || 0) + ", needs " + formatINR(el.minMonthlyIncome) + " or above.";
    }
    checks.push({ id: "income", label: "Monthly income", pass: incomePass, detail: incomeDetail });
  }

  // 5. Credit score
  if (isCoApp) {
    checks.push({
      id: "score",
      label: "Credit score",
      pass: true,
      detail: "Co-applicant assumed; credit score check not required.",
    });
  } else {
    let scorePass = true;
    let scoreDetail = "Credit score check not required.";
    if (el.minCreditScore > 0) {
      if (user.creditScore === null || user.creditScore === undefined) {
        scorePass = false;
        scoreDetail = "No credit history. A score of " + el.minCreditScore + " or above is needed.";
      } else {
        scorePass = user.creditScore >= el.minCreditScore;
        scoreDetail = scorePass
          ? "Credit score " + user.creditScore + " meets the minimum of " + el.minCreditScore + "."
          : "Credit score " + user.creditScore + ", needs " + el.minCreditScore + " or above.";
      }
    }
    checks.push({ id: "score", label: "Credit score", pass: scorePass, detail: scoreDetail });
  }

  // 6. Repayment burden (FOIR)
  if (isCoApp) {
    checks.push({
      id: "foir",
      label: "Repayment burden (FOIR)",
      pass: true,
      detail: "Co-applicant assumed; repayment burden check skipped.",
    });
  } else {
    const monthlyIncome = user.monthlyIncome || 0;
    const existingEmi = user.existingEmi || 0;
    const foirPass = monthlyIncome > 0 && foirCap >= minLoanAmount;

    let foirDetail = "";
    if (foirPass) {
      const foir = ((existingEmi + estimatedEmi) / monthlyIncome) * 100;
      foirDetail = "Repayment burden " + foir.toFixed(0) + "% — within the 50% limit.";
    } else {
      const roomStr = formatLakh(Math.max(0, foirCap));
      const minStr = formatLakh(minLoanAmount);
      foirDetail = "Your EMIs leave room for about " + roomStr + ", but this loan starts at " + minStr + ".";
    }

    checks.push({
      id: "foir",
      label: "Repayment burden (FOIR)",
      pass: foirPass,
      detail: foirDetail,
    });
  }

  // 7. Employment type (only if allowedEmployment is set)
  if (el.allowedEmployment && el.allowedEmployment.length > 0) {
    const empPass = el.allowedEmployment.includes(user.employment);
    checks.push({
      id: "employment",
      label: "Employment type",
      pass: empPass,
      detail: empPass
        ? user.employment + " is an accepted employment type."
        : user.employment + " is not accepted. Accepted: " + el.allowedEmployment.join(", ") + ".",
    });
  }

  const allPass = checks.every((c) => c.pass);

  return {
    result: allPass ? "eligible" : "not_eligible",
    checks,
    maxAmount: allPass ? maxAmount : null,
    indicativeRate,
    estimatedEmi: allPass ? estimatedEmi : null,
  };
}
