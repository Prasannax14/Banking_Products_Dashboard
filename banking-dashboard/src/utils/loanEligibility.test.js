import { describe, it, expect } from "vitest";
import { checkLoanEligibility } from "./loanEligibility.js";

// ---------- Minimal loan stubs matching products.json eligibility objects ----------
const loans = {
  "ln-001": {
    id: "ln-001", name: "Home Loan", category: "loan", interestType: "floating",
    metrics: [{ label: "Interest rate from", value: "6.85% p.a." }, { label: "Amount up to", value: "₹1,77,87,000" }],
    activeMetrics: [{ label: "Outstanding balance", value: "₹21,43,000" }, { label: "Next due date", value: "05 Nov 2026" }],
    outstandingAmount: 2143000,
    details: [],
    eligibility: { minAge: 21, maxAgeAtMaturity: 70, minMonthlyIncome: 40000, minCreditScore: 720, incomeMultiple: 60, tenureMonths: 240, minLoanAmount: 500000, allowedEmployment: null }
  },
  "ln-002": {
    id: "ln-002", name: "Personal Loan", category: "loan", interestType: "fixed",
    metrics: [{ label: "Interest rate from", value: "7.90% p.a." }, { label: "Amount up to", value: "₹33,20,000" }],
    details: [],
    eligibility: { minAge: 21, maxAgeAtMaturity: 65, minMonthlyIncome: 25000, minCreditScore: 700, incomeMultiple: 15, tenureMonths: 60, minLoanAmount: 50000, allowedEmployment: null }
  },
  "ln-003": {
    id: "ln-003", name: "Auto Loan", category: "loan", interestType: "fixed",
    metrics: [{ label: "Interest rate from", value: "6.40% p.a." }, { label: "Amount up to", value: "₹20,00,000" }],
    activeMetrics: [{ label: "Outstanding balance", value: "₹14,20,000" }, { label: "Next due date", "value": "10 Nov 2026" }],
    outstandingAmount: 1420000,
    details: [],
    eligibility: { minAge: 21, maxAgeAtMaturity: 65, minMonthlyIncome: 20000, minCreditScore: 680, incomeMultiple: 20, tenureMonths: 60, minLoanAmount: 100000, allowedEmployment: null }
  },
  "ln-004": {
    id: "ln-004", name: "Fixed-Rate Home Loan", category: "loan", interestType: "fixed",
    metrics: [{ label: "Interest rate from", value: "7.25% p.a." }, { label: "Amount up to", value: "₹4,15,00,000" }],
    details: [],
    eligibility: { minAge: 21, maxAgeAtMaturity: 70, minMonthlyIncome: 50000, minCreditScore: 750, incomeMultiple: 60, tenureMonths: 300, minLoanAmount: 1000000, allowedEmployment: null }
  },
  "ln-005": {
    id: "ln-005", name: "Education Loan", category: "loan", interestType: "floating",
    metrics: [{ label: "Interest rate from", value: "6.50% p.a." }, { label: "Amount up to", value: "₹49,80,000" }],
    details: [],
    eligibility: { minAge: 18, maxAgeAtMaturity: 45, minMonthlyIncome: 0, minCreditScore: 0, incomeMultiple: 0, tenureMonths: 120, minLoanAmount: 50000, coApplicantAssumed: true, allowedEmployment: null }
  },
};

const users = {
  gowtham: { id: "u-001", name: "Gowtham", age: 32, city: "Chennai", employment: "Salaried", monthlyIncome: 150000, creditScore: 790, existingEmi: 70000, kyc: "Verified", maskedPan: "XXXXX1234X", customerSinceYears: 6, holdings: { "sav-001": "Active", "cc-001": "Active", "ln-001": "Active", "ln-003": "Active", "sav-003": "Active", "wl-002": "Active" } },
  divya: { id: "u-002", name: "Divya", age: 28, city: "Kochi", employment: "Salaried", monthlyIncome: 60000, creditScore: 735, existingEmi: 12000, kyc: "Verified", maskedPan: "PAN BBBXX5678B", customerSinceYears: 2, holdings: { "sav-001": "Active" } },
  suresh: { id: "u-003", name: "Suresh", age: 45, city: "Pune", employment: "Self-employed", monthlyIncome: 90000, creditScore: 640, existingEmi: 30000, kyc: "Verified", maskedPan: "PAN CCCXX9012C", customerSinceYears: 4, holdings: { "sav-001": "Active", "cc-003": "Pending" } },
  kavya: { id: "u-004", name: "Kavya", age: 21, city: "Bengaluru", employment: "Student", monthlyIncome: 0, creditScore: null, existingEmi: 0, kyc: "Verified", maskedPan: "PAN DDDXX3456D", customerSinceYears: 1, holdings: {} },
  karthik: { id: "u-005", name: "Karthik", age: 38, city: "Hyderabad", employment: "Salaried", monthlyIncome: 110000, creditScore: 760, existingEmi: 65000, kyc: "Verified", maskedPan: "PAN EEEXX7890E", customerSinceYears: 8, holdings: { "ln-001": "Active", "sav-001": "Active" } },
  lakshmi: { id: "u-006", name: "Lakshmi", age: 59, city: "Coimbatore", employment: "Salaried", monthlyIncome: 95000, creditScore: 800, existingEmi: 10000, kyc: "Verified", maskedPan: "PAN FFFXX2345F", customerSinceYears: 15, holdings: { "sav-003": "Active", "sav-001": "Active" } },
  imran: { id: "u-007", name: "Imran", age: 34, city: "Mumbai", employment: "Salaried", monthlyIncome: 80000, creditScore: 710, existingEmi: 15000, kyc: "Pending", maskedPan: "PAN GGGXX6789G", customerSinceYears: 1, holdings: {} },
};

// ---------- Gowtham: Showcase User ----------
describe("Gowtham (Showcase User)", () => {
  it("holds ln-001 (Home Loan) -> already_holds", () => {
    const result = checkLoanEligibility(users.gowtham, loans["ln-001"], users.gowtham.holdings["ln-001"]);
    expect(result.result).toBe("already_holds");
  });

  it("holds ln-003 (Auto Loan) -> already_holds", () => {
    const result = checkLoanEligibility(users.gowtham, loans["ln-003"], users.gowtham.holdings["ln-003"]);
    expect(result.result).toBe("already_holds");
  });

  it("is eligible for ln-002 (Personal Loan)", () => {
    const result = checkLoanEligibility(users.gowtham, loans["ln-002"], undefined);
    expect(result.result).toBe("eligible");
    expect(result.maxAmount).toBeGreaterThanOrEqual(240000);
    expect(result.maxAmount).toBeLessThanOrEqual(260000);
  });

  it("is eligible for ln-005 (Education Loan)", () => {
    const result = checkLoanEligibility(users.gowtham, loans["ln-005"], undefined);
    expect(result.result).toBe("eligible");
  });

  it("is not_eligible for ln-004 (Fixed-Rate Home Loan) due to repayment-burden", () => {
    const result = checkLoanEligibility(users.gowtham, loans["ln-004"], undefined);
    expect(result.result).toBe("not_eligible");
    const foirCheck = result.checks.find((c) => c.id === "foir");
    expect(foirCheck.pass).toBe(false);
    expect(foirCheck.detail).toContain("Your EMIs leave room for about ₹6.9 lakh, but this loan starts at ₹10 lakh");
  });
});

// ---------- Imran: KYC Pending → not_eligible for ALL loans ----------
describe("Imran (KYC Pending)", () => {
  for (const [id, loan] of Object.entries(loans)) {
    it("is not eligible for " + loan.name, () => {
      const result = checkLoanEligibility(users.imran, loan, users.imran.holdings[id]);
      expect(result.result).toBe("not_eligible");
      const kycCheck = result.checks.find((c) => c.id === "kyc");
      expect(kycCheck.pass).toBe(false);
    });
  }
});

// ---------- Kavya: Student, 0 income, no credit → only Education Loan ----------
describe("Kavya (Student)", () => {
  it("is eligible only for Education Loan", () => {
    const result = checkLoanEligibility(users.kavya, loans["ln-005"], undefined);
    expect(result.result).toBe("eligible");
  });

  it("is not eligible for Home Loan (income, score)", () => {
    const result = checkLoanEligibility(users.kavya, loans["ln-001"], undefined);
    expect(result.result).toBe("not_eligible");
  });

  it("is not eligible for Personal Loan (income, score)", () => {
    const result = checkLoanEligibility(users.kavya, loans["ln-002"], undefined);
    expect(result.result).toBe("not_eligible");
  });

  it("is not eligible for Auto Loan (income, score)", () => {
    const result = checkLoanEligibility(users.kavya, loans["ln-003"], undefined);
    expect(result.result).toBe("not_eligible");
  });

  it("is not eligible for Fixed-Rate Home Loan (income, score)", () => {
    const result = checkLoanEligibility(users.kavya, loans["ln-004"], undefined);
    expect(result.result).toBe("not_eligible");
  });
});

// ---------- Karthik: high existing EMI → ln-001 holds, ln-004 fails repayment burden ----------
describe("Karthik (high existing EMI)", () => {
  it("returns already_holds for Home Loan (ln-001)", () => {
    const result = checkLoanEligibility(users.karthik, loans["ln-001"], users.karthik.holdings["ln-001"]);
    expect(result.result).toBe("already_holds");
  });

  it("is not_eligible for Fixed-Rate Home Loan (ln-004) due to repayment burden", () => {
    const result = checkLoanEligibility(users.karthik, loans["ln-004"], undefined);
    expect(result.result).toBe("not_eligible");
    const foirCheck = result.checks.find((c) => c.id === "foir");
    expect(foirCheck.pass).toBe(false);
  });
});

// ---------- Lakshmi: age 59 → ln-001 and ln-004 not eligible (age at loan end); ln-002 eligible ----------
describe("Lakshmi (age 59)", () => {
  it("is not eligible for Home Loan (ln-001) due to age at loan end", () => {
    const result = checkLoanEligibility(users.lakshmi, loans["ln-001"], undefined);
    expect(result.result).toBe("not_eligible");
    const ageEndCheck = result.checks.find((c) => c.id === "age-end");
    expect(ageEndCheck.pass).toBe(false);
  });

  it("is not eligible for Fixed-Rate Home Loan (ln-004) due to age at loan end", () => {
    const result = checkLoanEligibility(users.lakshmi, loans["ln-004"], undefined);
    expect(result.result).toBe("not_eligible");
    const ageEndCheck = result.checks.find((c) => c.id === "age-end");
    expect(ageEndCheck.pass).toBe(false);
  });

  it("is eligible for Personal Loan (ln-002)", () => {
    const result = checkLoanEligibility(users.lakshmi, loans["ln-002"], undefined);
    expect(result.result).toBe("eligible");
  });
});

// ---------- Suresh: low score, age at loan end → not eligible for any loan ----------
describe("Suresh (not eligible for any loan)", () => {
  for (const [id, loan] of Object.entries(loans)) {
    it("is not eligible for " + loan.name, () => {
      const result = checkLoanEligibility(users.suresh, loan, users.suresh.holdings[id]);
      expect(result.result).toBe("not_eligible");
    });
  }
});

// ---------- Divya: eligible for ln-001, ln-002, ln-003 ----------
describe("Divya (eligible for multiple loans)", () => {
  it("is eligible for Home Loan (ln-001)", () => {
    const result = checkLoanEligibility(users.divya, loans["ln-001"], undefined);
    expect(result.result).toBe("eligible");
  });

  it("is eligible for Personal Loan (ln-002)", () => {
    const result = checkLoanEligibility(users.divya, loans["ln-002"], undefined);
    expect(result.result).toBe("eligible");
  });

  it("is eligible for Auto Loan (ln-003)", () => {
    const result = checkLoanEligibility(users.divya, loans["ln-003"], undefined);
    expect(result.result).toBe("eligible");
  });
});
