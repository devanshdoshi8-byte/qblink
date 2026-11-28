import { describe, it, expect, beforeEach } from "vitest";
import { destinationFor, primaryRole, resolveUserDashboard, setLastActiveMode, getLastActiveMode } from "@/lib/auth/roles";

describe("account roles", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("a customer who signs up a business lands on the business dashboard", () => {
    expect(destinationFor(["customer", "business"], "business", false)).toBe("/dashboard");
  });

  it("a business owner who chooses customer mode lands on the customer dashboard", () => {
    expect(destinationFor(["customer", "business"], "customer", false)).toBe("/customer-dashboard");
  });

  it("plain sign-in sends admins to admin, owners to dashboard, others to customer", () => {
    expect(destinationFor(["admin"], "auto", true)).toBe("/admin");
    expect(destinationFor(["customer", "business"], "auto", false)).toBe("/dashboard");
    expect(destinationFor(["customer"], "auto", false)).toBe("/customer-dashboard");
  });

  it("an account with several roles still resolves a main role", () => {
    expect(primaryRole(["customer", "admin"])).toBe("admin");
    expect(primaryRole(["customer", "business"])).toBe("business");
    expect(primaryRole([])).toBeNull();
  });

  it("resolveUserDashboard routes single roles cleanly", () => {
    expect(resolveUserDashboard(["business"], false)).toBe("/dashboard");
    expect(resolveUserDashboard(["customer"], false)).toBe("/customer-dashboard");
    expect(resolveUserDashboard(["admin"], true)).toBe("/admin");
    expect(resolveUserDashboard([], true)).toBe("/admin");
  });

  it("resolveUserDashboard respects lastMode and defaults to business when unset", () => {
    expect(resolveUserDashboard(["customer", "business"], false, null)).toBe("/dashboard");
    expect(resolveUserDashboard(["customer", "business"], false, "customer")).toBe("/customer-dashboard");
    expect(resolveUserDashboard(["customer", "business"], false, "business")).toBe("/dashboard");
    expect(resolveUserDashboard(["customer", "business", "admin"], true, "admin")).toBe("/admin");
  });

  it("stores and retrieves last active mode in localStorage", () => {
    expect(getLastActiveMode()).toBeNull();
    setLastActiveMode("business");
    expect(getLastActiveMode()).toBe("business");
    setLastActiveMode("customer");
    expect(getLastActiveMode()).toBe("customer");
  });
});

