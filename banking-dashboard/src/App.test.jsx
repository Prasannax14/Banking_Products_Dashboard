import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import productsData from "../public/api/products.json";
import usersData from "../public/api/users.json";

function mockFetchSuccess() {
  globalThis.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes("products.json")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(JSON.parse(JSON.stringify(productsData))),
      });
    }
    if (url.includes("users.json")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(JSON.parse(JSON.stringify(usersData))),
      });
    }
    return Promise.reject(new Error("Unknown URL " + url));
  });
}

describe("App Component Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it("skeleton then content on load", async () => {
    let resolveProducts;
    let resolveUsers;

    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes("products.json")) {
        return new Promise((resolve) => {
          resolveProducts = () =>
            resolve({
              ok: true,
              json: () => Promise.resolve(JSON.parse(JSON.stringify(productsData))),
            });
        });
      }
      if (url.includes("users.json")) {
        return new Promise((resolve) => {
          resolveUsers = () =>
            resolve({
              ok: true,
              json: () => Promise.resolve(JSON.parse(JSON.stringify(usersData))),
            });
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<App />);

    // Skeleton is displayed while loading
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Loading products…")).toBeInTheDocument();

    // Resolve fetch
    resolveProducts();
    resolveUsers();

    // Content appears after fetch resolves
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Banking products/i })).toBeInTheDocument();
      expect(screen.getByText("Everyday Savings")).toBeInTheDocument();
    });
  });

  it("error then retry", async () => {
    let shouldFail = true;

    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (shouldFail) {
        return Promise.reject(new Error("Failed to fetch"));
      }
      if (url.includes("products.json")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(JSON.parse(JSON.stringify(productsData))),
        });
      }
      if (url.includes("users.json")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(JSON.parse(JSON.stringify(usersData))),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<App />);

    // Wait for error box to appear
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Couldn't load dashboard data")).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole("button", { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    // Now allow fetch to succeed and click retry
    shouldFail = false;
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Everyday Savings")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("category tab plus search filtering", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Everyday Savings")).toBeInTheDocument();
    });

    // Switch to Savings tab
    const savingsTab = screen.getByRole("tab", { name: /^savings/i });
    await user.click(savingsTab);

    expect(screen.getByText("Everyday Savings")).toBeInTheDocument();
    expect(screen.getByText("High-Yield Savings")).toBeInTheDocument();
    expect(screen.queryByText("Platinum Rewards Card")).not.toBeInTheDocument();

    // Filter with search query
    const searchInput = screen.getByRole("searchbox");
    await user.type(searchInput, "Yield");

    expect(screen.getByText("High-Yield Savings")).toBeInTheDocument();
    expect(screen.queryByText("Everyday Savings")).not.toBeInTheDocument();
  });

  it("Gowtham's Loans tab shows 2 active, 2 eligible and 1 not-eligible groups", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Everyday Savings")).toBeInTheDocument();
    });

    // Click Loans tab
    const loansTab = screen.getByRole("tab", { name: /^loans/i });
    await user.click(loansTab);

    // Verify the three distinct loan groups
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Your active loans \(2\)/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /You can apply for \(2\)/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Not available right now \(1\)/i })).toBeInTheDocument();
    });
  });

  it("switching to Karthik regroups and shows his own outstanding amount", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Everyday Savings")).toBeInTheDocument();
    });

    // Go to Loans tab
    const loansTab = screen.getByRole("tab", { name: /^loans/i });
    await user.click(loansTab);

    // Switch to Karthik (u-005)
    const userSelect = screen.getByLabelText("Switch user");
    await user.selectOptions(userSelect, "u-005");

    // Karthik holds ln-001 (Active: 1). All remaining loans exceed FOIR or age limit (Not available: 4).
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Your active loans \(1\)/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Not available right now \(4\)/i })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /You can apply for/i })).not.toBeInTheDocument();
    });

    // Turn on the user info bar switch to check Karthik's outstanding amount
    const infoSwitch = screen.getByRole("switch");
    await user.click(infoSwitch);

    // Karthik's outstanding amount is ₹21,43,000 from Home Loan
    await waitFor(() => {
      const amounts = screen.getAllByText("₹21,43,000");
      expect(amounts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("the User info switch toggles aria-checked and removes figures from the DOM when off", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Everyday Savings")).toBeInTheDocument();
    });

    const infoSwitch = screen.getByRole("switch");
    expect(infoSwitch).toHaveAttribute("aria-checked", "false");

    // Figures should not exist in the DOM when switch is off
    expect(screen.queryByText("Credit utilisation")).not.toBeInTheDocument();
    expect(screen.queryByText("Total balances")).not.toBeInTheDocument();

    // Toggle on
    await user.click(infoSwitch);
    expect(infoSwitch).toHaveAttribute("aria-checked", "true");

    // Figures now exist in DOM
    expect(screen.getByText("Credit utilisation")).toBeInTheDocument();
    expect(screen.getByText("Total balances")).toBeInTheDocument();

    // Toggle off again
    await user.click(infoSwitch);
    expect(infoSwitch).toHaveAttribute("aria-checked", "false");

    // Figures removed from DOM
    expect(screen.queryByText("Credit utilisation")).not.toBeInTheDocument();
    expect(screen.queryByText("Total balances")).not.toBeInTheDocument();
  });

  it("compare caps at 3", async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Everyday Savings")).toBeInTheDocument();
    });

    // Get all compare checkboxes
    const compareCheckboxes = screen.getAllByRole("checkbox", { name: /^Compare /i });
    expect(compareCheckboxes.length).toBeGreaterThanOrEqual(4);

    // Check first 3 products
    await user.click(compareCheckboxes[0]);
    await user.click(compareCheckboxes[1]);
    await user.click(compareCheckboxes[2]);

    // Compare tray is visible and says 3 / 3
    expect(screen.getByText("3 / 3")).toBeInTheDocument();

    // The 4th checkbox must be disabled
    expect(compareCheckboxes[3]).toBeDisabled();
    expect(compareCheckboxes[3]).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Maximum 3 products reached")
    );

    // Unchecking one re-enables the 4th
    await user.click(compareCheckboxes[0]);
    expect(compareCheckboxes[3]).not.toBeDisabled();
  });
});
