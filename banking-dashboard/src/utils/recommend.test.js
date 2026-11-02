import { describe, it, expect } from "vitest";
import { recommendProducts } from "./recommend.js";
import { checkLoanEligibility } from "./loanEligibility.js";
import productsData from "../../public/api/products.json";
import usersData from "../../public/api/users.json";

const products = productsData.products;
const usersById = Object.fromEntries(usersData.map((u) => [u.name.toLowerCase(), u]));

describe("recommendProducts", () => {
  it("Gowtham gets [ln-002, sav-002, cc-002]", () => {
    const recs = recommendProducts(usersById.gowtham, products);
    const ids = recs.map((r) => r.productId);
    expect(ids).toEqual(["ln-002", "sav-002", "cc-002"]);
  });

  it("Kavya's first recommendation is ln-005 (Education Loan)", () => {
    const recs = recommendProducts(usersById.kavya, products);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].productId).toBe("ln-005");
  });

  it("Imran gets no loans or cards plus the KYC notice", () => {
    const recs = recommendProducts(usersById.imran, products);
    const productCategories = recs.map((r) => {
      const p = products.find((prod) => prod.id === r.productId);
      return p?.category;
    });

    expect(productCategories).not.toContain("loan");
    expect(productCategories).not.toContain("credit-card");
    expect(recs.notice).toBe("Complete your KYC to unlock loans and cards");
  });
});

describe("checkLoanEligibility 'How to fix' strings", () => {
  const ln004 = products.find((p) => p.id === "ln-004");
  const ln002 = products.find((p) => p.id === "ln-002");
  const ln001 = products.find((p) => p.id === "ln-001");

  it("KYC failed check returns 'Complete your KYC verification'", () => {
    const res = checkLoanEligibility(usersById.imran, ln001, undefined);
    const kycCheck = res.checks.find((c) => c.id === "kyc");
    expect(kycCheck.pass).toBe(false);
    expect(kycCheck.fix).toBe("Complete your KYC verification");
  });

  it("Credit score check contains expected numbers (points to raise and target)", () => {
    // Suresh credit score = 640. ln-002 minCreditScore = 700. Diff = 60.
    const res = checkLoanEligibility(usersById.suresh, ln002, undefined);
    const scoreCheck = res.checks.find((c) => c.id === "score");
    expect(scoreCheck.pass).toBe(false);
    expect(scoreCheck.fix).toContain("60");
    expect(scoreCheck.fix).toContain("700");
  });

  it("Income check contains expected minimum income number", () => {
    const lowIncomeUser = { ...usersById.divya, monthlyIncome: 15000 };
    // ln-002 minMonthlyIncome = 25000
    const res = checkLoanEligibility(lowIncomeUser, ln002, undefined);
    const incomeCheck = res.checks.find((c) => c.id === "income");
    expect(incomeCheck.pass).toBe(false);
    expect(incomeCheck.fix).toContain("25,000");
  });

  it("Repayment burden check contains computed EMI-reduction figure", () => {
    // Gowtham on ln-004: excess EMI to reduce is 2,228
    const res = checkLoanEligibility(usersById.gowtham, ln004, undefined);
    const foirCheck = res.checks.find((c) => c.id === "foir");
    expect(foirCheck.pass).toBe(false);
    expect(foirCheck.fix).toContain("2,228");
  });

  it("Age checks return 'Not available for this age'", () => {
    // Suresh age = 45 on ln-005 maxAgeAtMaturity = 45 with tenure 120 (10 yrs) -> age at maturity 55 > 45
    const ln005 = products.find((p) => p.id === "ln-005");
    const res = checkLoanEligibility(usersById.suresh, ln005, undefined);
    const ageEndCheck = res.checks.find((c) => c.id === "age-end");
    expect(ageEndCheck.pass).toBe(false);
    expect(ageEndCheck.fix).toBe("Not available for this age");
  });
});
