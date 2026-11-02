import { useEffect, useMemo, useRef, useState } from "react";
import { fetchProducts } from "./api/productsApi.js";
import { fetchUsers } from "./api/usersApi.js";
import { checkLoanEligibility } from "./utils/loanEligibility.js";
import { recommendProducts } from "./utils/recommend.js";
import {
  parseUrlState,
  serializeUrlState,
  sortProducts,
  DEFAULT_SORT,
} from "./utils/urlState.js";
import CategoryTabs from "./components/CategoryTabs.jsx";
import SearchBox from "./components/SearchBox.jsx";
import SortSelect from "./components/SortSelect.jsx";
import InterestTypeFilter from "./components/InterestTypeFilter.jsx";
import ProductGrid from "./components/ProductGrid.jsx";
import ProductDetails from "./components/ProductDetails.jsx";
import RecommendedRow from "./components/RecommendedRow.jsx";
import CompareTray from "./components/CompareTray.jsx";
import CompareModal from "./components/CompareModal.jsx";
import CopyLinkButton from "./components/CopyLinkButton.jsx";
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
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [comparedIds, setComparedIds] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load products and users, then initialize state from URL
  useEffect(() => {
    Promise.all([fetchProducts(), fetchUsers()])
      .then(([productData, userData]) => {
        setData(productData);
        setUsers(userData);

        // Parse initial URL state against validated data
        const initial = parseUrlState(window.location.search, {
          users: userData,
          categories: productData.categories,
          products: productData.products,
        });

        const activeUser =
          (initial.user && userData.find((u) => u.id === initial.user)) ||
          userData[0] ||
          null;
        setSelectedUser(activeUser);

        if (initial.tab) setCategory(initial.tab);
        if (initial.q) setQuery(initial.q);
        if (initial.interest) setInterest(initial.interest);
        if (initial.eligible) setEligibleOnly(initial.eligible);
        if (initial.sort) setSort(initial.sort);
        if (initial.compare && initial.compare.length > 0) {
          setComparedIds(initial.compare);
        }
        if (initial.info) setInfoOpen(initial.info);

        setIsInitialized(true);
      })
      .catch((e) => setLoadError(e.message));
  }, []);

  // Debounce search query to 300ms for URL synchronization
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Synchronize state changes back to URL with history.replaceState
  useEffect(() => {
    if (!isInitialized || !data) return;

    const queryStr = serializeUrlState({
      user: selectedUser?.id,
      tab: category,
      q: debouncedQuery,
      interest,
      eligible: eligibleOnly,
      sort,
      compare: comparedIds,
      info: infoOpen,
    });

    const newUrl = queryStr
      ? `${window.location.pathname}${queryStr}`
      : window.location.pathname;

    window.history.replaceState(null, "", newUrl);
  }, [
    isInitialized,
    selectedUser,
    category,
    debouncedQuery,
    interest,
    eligibleOnly,
    sort,
    comparedIds,
    infoOpen,
    data,
  ]);

  // Manage body class for bottom compare tray padding
  useEffect(() => {
    if (comparedIds.length > 0) {
      document.body.classList.add("has-compare-tray");
    } else {
      document.body.classList.remove("has-compare-tray");
    }
    return () => document.body.classList.remove("has-compare-tray");
  }, [comparedIds.length]);

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
        const ctaLabel =
          holdingStatus === "Active" || holdingStatus === "Pending"
            ? "View Details"
            : "Apply";
        const metrics =
          holdingStatus === "Active" && p.activeMetrics
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

  // Recommendations for the selected user (up to 3)
  const recommendations = useMemo(() => {
    if (!selectedUser || !data?.products) return [];
    return recommendProducts(selectedUser, data.products);
  }, [selectedUser, data]);

  // Category, interest type (Loans tab only), search, and eligible-only combine into one filter.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enrichedProducts.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (category === "loan" && interest !== "all" && p.interestType !== interest)
        return false;
      if (category === "loan" && eligibleOnly) {
        const el = eligibilityMap[p.id];
        if (el && el.result === "not_eligible") return false;
      }
      if (!q) return true;
      return [
        p.name,
        categoryLabels[p.category],
        p.status,
        interestTypes[p.interestType]?.label ?? "",
      ].some((s) => s.toLowerCase().includes(q));
    });
  }, [
    enrichedProducts,
    category,
    interest,
    query,
    categoryLabels,
    interestTypes,
    eligibleOnly,
    eligibilityMap,
  ]);

  // Apply sorting (on non-loan tabs flat; loan tabs sort within their groups)
  const sortedVisible = useMemo(() => {
    if (category === "loan") return visible;
    return sortProducts(visible, sort);
  }, [visible, sort, category]);

  const reset = () => {
    setCategory("all");
    setInterest("all");
    setQuery("");
    setEligibleOnly(false);
    setSort(DEFAULT_SORT);
  };

  // Toggle compare handler (caps at 3)
  const handleToggleCompare = (id) => {
    setComparedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  // Products currently in compare tray
  const comparedProducts = useMemo(() => {
    return enrichedProducts.filter((p) => comparedIds.includes(p.id));
  }, [enrichedProducts, comparedIds]);

  // Eligibility for the currently open dialog product
  const selectedEligibility =
    selected && selected.category === "loan" ? eligibilityMap[selected.id] : null;

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
                <CopyLinkButton />
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
                onChange={(cat) => {
                  setCategory(cat);
                  setEligibleOnly(false);
                }}
              />
              <div className="controls-actions">
                <SearchBox value={query} onChange={setQuery} />
                <SortSelect value={sort} onChange={setSort} />
              </div>
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
              {sortedVisible.length} {sortedVisible.length === 1 ? "product" : "products"}
            </p>
            <ProductGrid
              products={sortedVisible}
              categoryLabels={categoryLabels}
              interestTypes={interestTypes}
              onAction={setSelected}
              onReset={reset}
              eligibilityMap={eligibilityMap}
              isLoanTab={category === "loan"}
              comparedIds={comparedIds}
              onToggleCompare={handleToggleCompare}
              sortMode={sort}
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

      <CompareTray
        selectedProducts={comparedProducts}
        onOpenCompare={() => setCompareModalOpen(true)}
        onClear={() => setComparedIds([])}
      />

      <CompareModal
        isOpen={compareModalOpen}
        products={comparedProducts}
        categoryLabels={categoryLabels}
        interestTypes={interestTypes}
        onClose={() => setCompareModalOpen(false)}
        onRemove={(id) => setComparedIds((prev) => prev.filter((x) => x !== id))}
      />
    </>
  );
}
