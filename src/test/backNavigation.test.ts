import { describe, expect, it } from "vitest";
import { backDestination } from "@/lib/backNavigation";

describe("safe back destinations", () => {
  it("returns signup and sign-in to role selection", () => {
    for (const path of ["/auth/signin", "/auth/customer", "/auth/business"]) {
      expect(backDestination(path)).toBe("/auth");
    }
  });
  it("returns password reset to sign-in", () => {
    expect(backDestination("/auth/forgot-password")).toBe("/auth/signin");
  });
  it("returns portal subpages to their own portal", () => {
    expect(backDestination("/customer-dashboard/profile")).toBe("/customer-dashboard");
    expect(backDestination("/dashboard/settings")).toBe("/dashboard");
    expect(backDestination("/admin/businesses")).toBe("/admin");
  });
  it("returns public entry pages to home without relying on browser history", () => {
    for (const path of ["/install", "/auth", "/affiliate", "/join/missing"]) {
      expect(backDestination(path)).toBe("/");
    }
  });
});