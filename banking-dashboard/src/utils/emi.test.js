import { describe, it, expect } from "vitest";
import { calculateEmi, emiAfterRateRise } from "./emi.js";

describe("calculateEmi", () => {
  it("calculates known value: 10,00,000 at 8% for 120 months gives EMI of 12,133", () => {
    const result = calculateEmi(1000000, 8, 120);
    expect(result.emi).toBe(12133);
    expect(result.totalPayable).toBe(12133 * 120);
    expect(result.totalInterest).toBe(result.totalPayable - 1000000);
  });

  it("handles zero rate correctly: 1,20,000 at 0% for 12 months", () => {
    const result = calculateEmi(120000, 0, 12);
    expect(result.emi).toBe(10000);
    expect(result.totalPayable).toBe(120000);
    expect(result.totalInterest).toBe(0);
  });

  it("handles zero or negative principal and months", () => {
    expect(calculateEmi(0, 8.5, 60)).toEqual({ emi: 0, totalPayable: 0, totalInterest: 0 });
    expect(calculateEmi(-50000, 8.5, 60)).toEqual({ emi: 0, totalPayable: 0, totalInterest: 0 });
    expect(calculateEmi(50000, 8.5, 0)).toEqual({ emi: 0, totalPayable: 0, totalInterest: 0 });
  });

  it("calculates 50,000 at 12% for 12 months", () => {
    // P = 50000, r = 0.01, n = 12 -> 50000 * 0.01 * 1.01^12 / (1.01^12 - 1) = 4442.44 -> 4442
    const result = calculateEmi(50000, 12, 12);
    expect(result.emi).toBe(4442);
    expect(result.totalPayable).toBe(4442 * 12);
    expect(result.totalInterest).toBe(4442 * 12 - 50000);
  });
});

describe("emiAfterRateRise", () => {
  it("computes rate-rise impact and ensures shocked EMI is higher", () => {
    const principal = 1000000;
    const baseRate = 8;
    const months = 120;
    const risePct = 1.5;

    const shock = emiAfterRateRise(principal, baseRate, months, risePct);

    expect(shock.emi).toBe(12133);
    expect(shock.shockedEmi).toBeGreaterThan(shock.emi);
    expect(shock.monthlyDifference).toBe(shock.shockedEmi - shock.emi);
    expect(shock.extraTotalInterest).toBe(shock.shockedTotalInterest - shock.totalInterest);
    expect(shock.extraTotalInterest).toBeGreaterThan(0);
  });

  it("returns zero difference when rise is 0", () => {
    const shock = emiAfterRateRise(500000, 7.5, 60, 0);
    expect(shock.monthlyDifference).toBe(0);
    expect(shock.extraTotalInterest).toBe(0);
    expect(shock.shockedEmi).toBe(shock.emi);
  });
});

