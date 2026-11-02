/**
 * Pure loan EMI calculation functions.
 * Standard reducing-balance formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
 * All figures fictional.
 */

/**
 * Calculate standard reducing-balance monthly EMI, total payable, and total interest.
 *
 * @param {number} principal - Loan amount (P)
 * @param {number} annualRatePct - Annual interest rate in percent (e.g. 8.5 for 8.5%)
 * @param {number} months - Tenure in months (n)
 * @returns {{ emi: number, totalPayable: number, totalInterest: number }} All figures rounded to nearest rupee.
 */
export function calculateEmi(principal, annualRatePct, months) {
  if (!principal || principal <= 0 || !months || months <= 0) {
    return { emi: 0, totalPayable: 0, totalInterest: 0 };
  }

  // Rate 0 edge case: simple equal split
  if (annualRatePct === 0) {
    const emi = Math.round(principal / months);
    const totalPayable = principal;
    const totalInterest = 0;
    return { emi, totalPayable, totalInterest };
  }

  const r = annualRatePct / 12 / 100;
  const n = months;
  const factor = Math.pow(1 + r, n);
  const emiRaw = (principal * r * factor) / (factor - 1);
  const emi = Math.round(emiRaw);
  const totalPayable = emi * months;
  const totalInterest = Math.max(0, totalPayable - Math.round(principal));

  return { emi, totalPayable, totalInterest };
}

/**
 * Calculate rate shock impact on EMI and total interest for floating-rate loans.
 *
 * @param {number} principal - Loan amount
 * @param {number} annualRatePct - Current annual interest rate
 * @param {number} months - Tenure in months
 * @param {number} risePct - Rate rise in percentage points (e.g. 1.25)
 * @returns {{
 *   emi: number,
 *   emiNow: number,
 *   shockedEmi: number,
 *   emiAfter: number,
 *   monthlyDifference: number,
 *   totalInterest: number,
 *   shockedTotalInterest: number,
 *   extraTotalInterest: number,
 *   totalPayable: number,
 *   shockedTotalPayable: number
 * }}
 */
export function emiAfterRateRise(principal, annualRatePct, months, risePct = 0) {
  const base = calculateEmi(principal, annualRatePct, months);
  const shocked = calculateEmi(principal, annualRatePct + risePct, months);

  const monthlyDifference = Math.max(0, shocked.emi - base.emi);
  const extraTotalInterest = Math.max(0, shocked.totalInterest - base.totalInterest);

  return {
    emi: base.emi,
    emiNow: base.emi,
    shockedEmi: shocked.emi,
    emiAfter: shocked.emi,
    monthlyDifference,
    totalInterest: base.totalInterest,
    shockedTotalInterest: shocked.totalInterest,
    extraTotalInterest,
    totalPayable: base.totalPayable,
    shockedTotalPayable: shocked.totalPayable,
  };
}
