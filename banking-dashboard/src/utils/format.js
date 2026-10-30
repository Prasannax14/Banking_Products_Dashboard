/**
 * Format a number as Indian-style currency string with the Rupee symbol.
 * Examples: 150000 -> "₹1,50,000", 4150000 -> "₹41,50,000"
 */
export function formatINR(amount) {
  const rounded = Math.round(amount);
  const str = String(Math.abs(rounded));
  let result = "";
  const last3 = str.length > 3 ? str.slice(-3) : str;
  const rest = str.slice(0, str.length - 3);
  result = last3;
  if (rest.length > 0) {
    // Group the rest in pairs from the right
    let pairs = "";
    let i = rest.length;
    while (i > 0) {
      const start = Math.max(0, i - 2);
      pairs = rest.slice(start, i) + (pairs ? "," + pairs : "");
      i = start;
    }
    result = pairs + "," + result;
  }
  return "₹" + (rounded < 0 ? "-" : "") + result;
}

/**
 * Format a percentage with up to 2 decimal places, trimming trailing zeros.
 * Example: 7.9 -> "7.90%", 8.5 -> "8.50%"
 */
export function formatPct(value) {
  return value.toFixed(2).replace(/\.?0+$/, "") + "%";
}

/**
 * Format an amount in Indian lakh/crore notation with the ₹ symbol.
 * Example: 691409 -> "₹6.9 lakh", 1000000 -> "₹10 lakh", 12500000 -> "₹1.25 crore", 50000 -> "₹50,000"
 */
export function formatLakh(amount) {
  if (amount >= 10000000) {
    const cr = (amount / 10000000).toFixed(2).replace(/\.?0+$/, "");
    return `₹${cr} crore`;
  }
  if (amount >= 100000) {
    const lk = (amount / 100000).toFixed(1).replace(/\.0$/, "");
    return `₹${lk} lakh`;
  }
  return formatINR(amount);
}
