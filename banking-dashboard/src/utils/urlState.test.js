import { describe, it, expect } from "vitest";
import {
  sortProducts,
  parseUrlState,
  serializeUrlState,
  DEFAULT_SORT,
} from "./urlState.js";

const mockData = {
  users: [{ id: "u-001" }, { id: "u-002" }, { id: "u-003" }],
  categories: [
    { id: "savings" },
    { id: "credit-card" },
    { id: "loan" },
    { id: "wealth" },
  ],
  products: [
    { id: "p1", name: "Product B", sortRate: 5.5, sortLimit: 100000 },
    { id: "p2", name: "Product A", sortRate: 3.2, sortLimit: null },
    { id: "p3", name: "Product C", sortRate: null, sortLimit: 500000 },
    { id: "p4", name: "Product D", sortRate: 8.0, sortLimit: 200000 },
  ],
};

describe("urlState round-trip and validation", () => {
  it("serialize then parse round-trips valid state", () => {
    const original = {
      user: "u-002",
      tab: "loan",
      q: "home",
      interest: "floating",
      eligible: true,
      sort: "rate",
      compare: ["p1", "p2"],
      info: true,
    };

    const serialized = serializeUrlState(original);
    const parsed = parseUrlState(serialized, mockData);

    expect(parsed).toEqual(original);
  });

  it("invalid values fall back to defaults", () => {
    const invalidQuery = "?user=u-unknown&tab=nonexistent&interest=invalid&sort=random&compare=fake1,fake2&info=maybe";
    const parsed = parseUrlState(invalidQuery, mockData);

    expect(parsed.user).toBeNull();
    expect(parsed.tab).toBe("all");
    expect(parsed.interest).toBe("all");
    expect(parsed.sort).toBe(DEFAULT_SORT);
    expect(parsed.compare).toEqual([]);
    expect(parsed.eligible).toBe(false);
    expect(parsed.info).toBe(false);
  });

  it("compare caps at 3 items in both parser and serializer", () => {
    // 4 valid items passed
    const query = "?compare=p1,p2,p3,p4";
    const parsed = parseUrlState(query, mockData);
    expect(parsed.compare).toEqual(["p1", "p2", "p3"]);
    expect(parsed.compare.length).toBe(3);

    const serialized = serializeUrlState({ compare: ["p1", "p2", "p3", "p4"] });
    expect(serialized).toBe("?compare=p1%2Cp2%2Cp3");
  });
});

describe("sortProducts", () => {
  const items = [
    { id: "1", name: "Banana", sortRate: 7.5, sortLimit: 50000 },
    { id: "2", name: "Apple", sortRate: null, sortLimit: 200000 },
    { id: "3", name: "Cherry", sortRate: 3.5, sortLimit: null },
    { id: "4", name: "Date", sortRate: 10.0, sortLimit: 100000 },
  ];

  it("sorts by Name A-Z", () => {
    const sorted = sortProducts(items, "name");
    expect(sorted.map((i) => i.name)).toEqual(["Apple", "Banana", "Cherry", "Date"]);
  });

  it("sorts by Lowest rate and puts nulls last", () => {
    const sorted = sortProducts(items, "rate");
    expect(sorted.map((i) => i.id)).toEqual(["3", "1", "4", "2"]);
    expect(sorted[3].sortRate).toBeNull();
  });

  it("sorts by Highest limit and puts nulls last", () => {
    const sorted = sortProducts(items, "limit");
    expect(sorted.map((i) => i.id)).toEqual(["2", "4", "1", "3"]);
    expect(sorted[3].sortLimit).toBeNull();
  });

  it("leaves recommended in original order", () => {
    const sorted = sortProducts(items, "recommended");
    expect(sorted.map((i) => i.id)).toEqual(["1", "2", "3", "4"]);
  });
});

