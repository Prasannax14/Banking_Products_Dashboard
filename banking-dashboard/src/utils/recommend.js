import { checkLoanEligibility } from "./loanEligibility.js";

/**
 * Recommend up to 3 products for a user based on fixed rules in order:
 * 1. The eligible loan with the lowest indicative rate (ln-005 only for Students). Skipped if KYC is Pending.
 * 2. The not-held savings product with the highest rate (sortRate).
 * 3. A not-held credit card only if creditScore >= 700 and KYC is Verified.
 * 4. The first not-held wealth product in file order.
 *
 * If KYC is Pending, recommend no loans or cards and return a "Complete your KYC to unlock loans and cards" notice.
 *
 * @param {object} user - User object from users.json
 * @param {Array<object>} products - List of product objects
 * @returns {Array<{ productId: string, reason: string }> & { notice?: string | null }}
 */
export function recommendProducts(user, products = []) {
  if (!user || !Array.isArray(products)) {
    const empty = [];
    empty.notice = null;
    return empty;
  }

  const holdings = user.holdings || {};
  const isHeld = (id) => Boolean(holdings[id]);
  const isKycPending = user.kyc === "Pending";
  const isKycVerified = user.kyc === "Verified";

  const recommendations = [];

  // Rule 1: Eligible loan with the lowest indicative rate (ln-005 only for Students)
  if (!isKycPending) {
    const loanCandidates = products.filter(
      (p) => p.category === "loan" && !isHeld(p.id)
    );

    let bestLoan = null;
    let lowestRate = Infinity;
    let bestLoanRate = null;

    loanCandidates.forEach((loan) => {
      // ln-005 is restricted to Students
      if (loan.id === "ln-005" && user.employment !== "Student") {
        return;
      }

      const el = checkLoanEligibility(user, loan, holdings[loan.id]);
      if (el.result === "eligible" && el.indicativeRate != null) {
        if (el.indicativeRate < lowestRate) {
          lowestRate = el.indicativeRate;
          bestLoan = loan;
          bestLoanRate = el.indicativeRate;
        }
      }
    });

    if (bestLoan) {
      recommendations.push({
        productId: bestLoan.id,
        reason: `Eligible at competitive indicative rate of ${bestLoanRate.toFixed(2)}% p.a.`,
      });
    }
  }

  // Rule 2: Not-held savings product with the highest rate (using numeric sortRate)
  if (recommendations.length < 3) {
    const savingsCandidates = products
      .filter((p) => p.category === "savings" && !isHeld(p.id))
      .sort((a, b) => {
        const rateA = typeof a.sortRate === "number" ? a.sortRate : -Infinity;
        const rateB = typeof b.sortRate === "number" ? b.sortRate : -Infinity;
        return rateB - rateA;
      });

    const bestSavings = savingsCandidates[0];
    if (bestSavings) {
      recommendations.push({
        productId: bestSavings.id,
        reason: bestSavings.sortRate != null
          ? `High interest rate of ${bestSavings.sortRate.toFixed(2)}% p.a. on your deposits`
          : "Essential savings account to grow your emergency fund",
      });
    }
  }

  // Rule 3: Not-held credit card only if creditScore >= 700 and KYC Verified
  if (
    recommendations.length < 3 &&
    isKycVerified &&
    user.creditScore != null &&
    user.creditScore >= 700
  ) {
    const cardCandidates = products.filter(
      (p) => p.category === "credit-card" && !isHeld(p.id)
    );

    const bestCard = cardCandidates[0];
    if (bestCard) {
      recommendations.push({
        productId: bestCard.id,
        reason: `Recommended for your strong credit profile (score ${user.creditScore})`,
      });
    }
  }

  // Rule 4: First not-held wealth product in file order
  if (recommendations.length < 3) {
    const wealthCandidates = products.filter(
      (p) => p.category === "wealth" && !isHeld(p.id)
    );

    const bestWealth = wealthCandidates[0];
    if (bestWealth) {
      recommendations.push({
        productId: bestWealth.id,
        reason: "Diversify and grow your wealth with tailored market investments",
      });
    }
  }

  // Cap at 3 items
  const finalRecs = recommendations.slice(0, 3);
  finalRecs.notice = isKycPending
    ? "Complete your KYC to unlock loans and cards"
    : null;

  return finalRecs;
}
