/**
 * Pure URL state parsing, serialization, and product sorting utilities.
 * No router, no side effects — safe to test and use anywhere.
 */

export const DEFAULT_SORT = "recommended";
export const ALLOWED_SORTS = ["recommended", "name", "rate", "limit"];
export const ALLOWED_INTEREST = ["all", "fixed", "floating"];

/**
 * Sort products according to the given sortMode:
 * - "recommended": original order
 * - "name": Name A-Z
 * - "rate": Lowest rate (sortRate ascending, nulls always last)
 * - "limit": Highest limit (sortLimit descending, nulls always last)
 *
 * @param {Array<object>} products
 * @param {string} sortMode
 * @returns {Array<object>} New sorted array
 */
export function sortProducts(products = [], sortMode = DEFAULT_SORT) {
  if (!Array.isArray(products)) return [];
  const list = [...products];

  switch (sortMode) {
    case "name":
      return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    case "rate":
      return list.sort((a, b) => {
        const hasA = typeof a.sortRate === "number";
        const hasB = typeof b.sortRate === "number";
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1; // nulls last
        if (!hasB) return -1; // nulls last
        return a.sortRate - b.sortRate;
      });

    case "limit":
      return list.sort((a, b) => {
        const hasA = typeof a.sortLimit === "number";
        const hasB = typeof b.sortLimit === "number";
        if (!hasA && !hasB) return 0;
        if (!hasA) return 1; // nulls last
        if (!hasB) return -1; // nulls last
        return b.sortLimit - a.sortLimit;
      });

    case "recommended":
    default:
      return list;
  }
}

/**
 * Parse URL search string into a validated state object against loaded data.
 *
 * @param {string} searchString - e.g. "?user=u-002&tab=loan&sort=rate&compare=ln-001,ln-002"
 * @param {{ users?: Array<{ id: string }>, categories?: Array<{ id: string }>, products?: Array<{ id: string }> }} validData
 * @returns {{
 *   user: string | null,
 *   tab: string,
 *   q: string,
 *   interest: string,
 *   eligible: boolean,
 *   sort: string,
 *   compare: Array<string>,
 *   info: boolean
 * }}
 */
export function parseUrlState(searchString = "", validData = {}) {
  const params = new URLSearchParams(
    searchString.startsWith("?") ? searchString.slice(1) : searchString
  );

  const validUsers = new Set((validData.users || []).map((u) => u.id));
  const validCategories = new Set([
    "all",
    ...(validData.categories || []).map((c) => c.id),
  ]);
  const validProductIds = new Set((validData.products || []).map((p) => p.id));

  // User
  const rawUser = params.get("user");
  const user = rawUser && validUsers.has(rawUser) ? rawUser : null;

  // Category Tab
  const rawTab = params.get("tab");
  const tab = rawTab && validCategories.has(rawTab) ? rawTab : "all";

  // Query
  const q = (params.get("q") || "").trim();

  // Interest Type (Loans tab)
  const rawInterest = params.get("interest");
  const interest = rawInterest && ALLOWED_INTEREST.includes(rawInterest)
    ? rawInterest
    : "all";

  // Eligible only
  const rawEligible = params.get("eligible");
  const eligible = rawEligible === "true" || rawEligible === "1";

  // Sort
  const rawSort = params.get("sort");
  const sort = rawSort && ALLOWED_SORTS.includes(rawSort) ? rawSort : DEFAULT_SORT;

  // Compare (max 3, valid product IDs only)
  const rawCompare = params.get("compare");
  let compare = [];
  if (rawCompare) {
    compare = rawCompare
      .split(",")
      .map((id) => id.trim())
      .filter((id) => (validProductIds.size === 0 ? Boolean(id) : validProductIds.has(id)))
      .slice(0, 3);
  }

  // Info bar open
  const rawInfo = params.get("info");
  const info = rawInfo === "true" || rawInfo === "1" || rawInfo === "open";

  return {
    user,
    tab,
    q,
    interest,
    eligible,
    sort,
    compare,
    info,
  };
}

/**
 * Serialize state object into a URL search query string.
 * Omits defaults for clean, readable URLs.
 *
 * @param {{
 *   user?: string | null,
 *   tab?: string,
 *   q?: string,
 *   interest?: string,
 *   eligible?: boolean,
 *   sort?: string,
 *   compare?: Array<string>,
 *   info?: boolean
 * }} state
 * @returns {string} e.g. "?user=u-002&tab=loan" or ""
 */
export function serializeUrlState(state = {}) {
  const params = new URLSearchParams();

  if (state.user) {
    params.set("user", state.user);
  }
  if (state.tab && state.tab !== "all") {
    params.set("tab", state.tab);
  }
  if (state.q && state.q.trim()) {
    params.set("q", state.q.trim());
  }
  if (state.interest && state.interest !== "all") {
    params.set("interest", state.interest);
  }
  if (state.eligible) {
    params.set("eligible", "true");
  }
  if (state.sort && state.sort !== DEFAULT_SORT) {
    params.set("sort", state.sort);
  }
  if (Array.isArray(state.compare) && state.compare.length > 0) {
    // Cap at 3
    params.set("compare", state.compare.slice(0, 3).join(","));
  }
  if (state.info) {
    params.set("info", "true");
  }

  const str = params.toString();
  return str ? `?${str}` : "";
}

