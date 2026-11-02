import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "./api/productsApi.js";
import { fetchUsers } from "./api/usersApi.js";
import { checkLoanEligibility } from "./utils/loanEligibility.js";
import { recommendProducts } from "./utils/recommend.js";
import CategoryTabs from "./components/CategoryTabs.jsx";
import SearchBox from "./components/SearchBox.jsx";
import InterestTypeFilter from "./components/InterestTypeFilter.jsx";
import ProductGrid from "./components/ProductGrid.jsx";
import ProductDetails from "./components/ProductDetails.jsx";
import RecommendedRow from "./components/RecommendedRow.jsx";
import Logo from "./components/Logo.jsx";
import UserSwitcher from "./components/UserSwitcher.jsx";

export default function App() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [category, setCategory] = useState("all");
  const [interest, setInterest] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [eligibleOnly, setEligibleOnly] = useState(false);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchUsers()])
      .then(([productData, userData]) => {
        setData(productData);
        setUsers(userData);
        setSelectedUser(userData[0] ?? null);
      })
      .catch((e) => setLoadError(e.message));
  }, []);

  const categoryLabels = useMemo(
    () => Object.fromEntries((data?.categories ?? []).map((c) => [c.id, c.label])),
    [data]
  );
  const interestTypes = useMemo(
    () => Object.fromEntries((data?.interestTypes ?? []).map((t) => [t.id, t])),
    [data]
  );

  // Derive per-user product status from selectedUser.holdings; fall back to product default.
  // When active, use activeMetrics (outstanding balance, next due date) if defined.
  const enrichedProducts = useMemo(() => {
    if (!data || !selectedUser) return data?.products ?? [];
    return (data.products ?? []).map((p) => {
      const holdingStatus = selectedUser.holdings?.[p.id];
      if (holdingStatus) {
        const ctaLabel = holdingStatus === "Active" || holdingStatus === "Pending"
          ? "View Details"
          : "Apply";
        const metrics = holdingStatus === "Active" && p.activeMetrics
          ? p.activeMetrics
          : p.metrics;
        return { ...p, status: holdingStatus, ctaLabel, metrics };
      }
      return { ...p, status: "Available", ctaLabel: "Apply" };
    });
  }, [data, selectedUser]);

  // Run eligibility check for every loan for the selected user
  const eligibilityMap = useMemo(() => {
    if (!selectedUser) return {};
    const map = {};
    (enrichedProducts ?? []).forEach((p) => {
      if (p.category === "loan") {
        const userStatus = selectedUser.holdings?.[p.id];
        map[p.id] = checkLoanEligibility(selectedUser, p, userStatus);
      }
    });
    return map;
  }, [enrichedProducts, selectedUser]);

  const counts = useMemo(() => {
    const c = { all: enrichedProducts.length };
    enrichedProducts.forEach((p) => (c[p.category] = (c[p.category] ?? 0) + 1));
    return c;
  }, [enrichedProducts]);

  const interestCounts = useMemo(() => {
    const c = {};
    enrichedProducts.forEach(
      (p) => p.interestType && (c[p.interestType] = (c[p.interestType] ?? 0) + 1)
    );
    return c;
  }, [enrichedProducts]);

  // Category, interest type (Loans tab only), search, and eligible-only combine into one filter.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enrichedProducts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (category === "loan" && interest !== "all" && p.interestType !== interest) return false;
      if (category === "loan" && eligibleOnly) {
        const el = eligibilityMap[p.id];
        if (el && el.result === "not_eligible") return false;
      }
      if (!q) return true;
      return [p.name, categoryLabels[p.category], p.status, interestTypes[p.interestType]?.label ?? ""]
        .some((s) => s.toLowerCase().includes(q));
    });
  }, [enrichedProducts, category, interest, query, categoryLabels, interestTypes, eligibleOnly, eligibilityMap]);

  const reset = () => { setCategory("all"); setInterest("all"); setQuery(""); setEligibleOnly(false); };

  // Eligibility for the currently open dialog product
  const selectedEligibility = selected && selected.category === "loan"
    ? eligibilityMap[selected.id]
    : null;

  // Recommendations for the selected user (up to 3)
  const recommendations = useMemo(() => {
    if (!selectedUser || !data?.products) return [];
    return recommendProducts(selectedUser, data.products);
  }, [selectedUser, data]);

  return (
    <>
      <header className="masthead">
        <div className="wrap masthead-inner">
          <div className="masthead-top">
            <div className="masthead-brand">
              <Logo />
              {data?.bank?.name && <span className="brand-name">{data.bank.name}</span>}
            </div>
            {selectedUser && (
              <div className="masthead-user">
                <UserSwitcher
                  users={users}
                  selectedUser={selectedUser}
                  onSelect={setSelectedUser}
                />
              </div>
            )}
          </div>
          <div className="masthead-headings">
            <h1>Banking products</h1>
            <p>Your accounts, cards, loans and investments in one place.</p>
          </div>
        </div>
      </header>

      <main className="wrap main">
        {loadError && (
          <p className="state state-error" role="alert">
            Couldn't load data: {loadError}. Refresh to try again.
          </p>
        )}
        {!data && !loadError && <p className="state" role="status">Loading…</p>}

        {data && (
          <>
            <div className="controls">
              <CategoryTabs
                categories={data.categories}
                counts={counts}
                active={category}
                onChange={(cat) => { setCategory(cat); setEligibleOnly(false); }}
              />
              <SearchBox value={query} onChange={setQuery} />
            </div>

            {category === "loan" && (
              <InterestTypeFilter
                types={data.interestTypes}
                counts={interestCounts}
                active={interest}
                onChange={setInterest}
                userName={selectedUser?.name}
                eligibleOnly={eligibleOnly}
                onToggleEligibleOnly={setEligibleOnly}
              />
            )}

            {category === "all" && (
              <RecommendedRow
                recommendations={recommendations}
                products={enrichedProducts}
                userName={selectedUser?.name}
                onSelectProduct={setSelected}
                categoryLabels={categoryLabels}
              />
            )}

            <p className="result-count" aria-live="polite">
              {visible.length} {visible.length === 1 ? "product" : "products"}
            </p>
            <ProductGrid
              products={visible}
              categoryLabels={categoryLabels}
              interestTypes={interestTypes}
              onAction={setSelected}
              onReset={reset}
              eligibilityMap={eligibilityMap}
              isLoanTab={category === "loan"}
            />
          </>
        )}
      </main>

      <ProductDetails
        product={selected}
        categoryLabel={selected && categoryLabels[selected.category]}
        interestType={selected && interestTypes[selected.interestType]}
        onClose={() => setSelected(null)}
        eligibility={selectedEligibility}
        userName={selectedUser?.name}
      />
    </>
  );
}
