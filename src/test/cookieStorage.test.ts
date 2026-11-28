import { describe, it, expect, beforeEach } from "vitest";
import {
  setCookie,
  getCookie,
  removeCookie,
  saveCustomerDetails,
  getSavedCustomerDetails,
  saveBusinessDraft,
  getSavedBusinessDraft,
  clearBusinessDraft,
  savePreferredRole,
  getPreferredRole,
  COOKIE_KEYS,
} from "@/lib/storage/cookieStorage";

describe("cookieStorage utility", () => {
  beforeEach(() => {
    localStorage.clear();
    // Clear mock document cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  });

  it("sets, gets and removes cookies with localStorage synchronization", () => {
    setCookie("test_key", "test_value_123");
    expect(getCookie("test_key")).toBe("test_value_123");
    expect(localStorage.getItem("test_key")).toBe("test_value_123");

    removeCookie("test_key");
    expect(getCookie("test_key")).toBeNull();
    expect(localStorage.getItem("test_key")).toBeNull();
  });

  it("falls back to localStorage if cookie is cleared", () => {
    localStorage.setItem("fallback_key", "from_storage");
    expect(getCookie("fallback_key")).toBe("from_storage");
  });

  it("saves and retrieves customer details seamlessly", () => {
    saveCustomerDetails({
      name: "Aarav Sharma",
      phone: "9876543210",
      email: "aarav@example.com",
    });

    const saved = getSavedCustomerDetails();
    expect(saved.name).toBe("Aarav Sharma");
    expect(saved.phone).toBe("9876543210");
    expect(saved.email).toBe("aarav@example.com");
  });

  it("honors prefill opt-out", () => {
    setCookie(COOKIE_KEYS.PREFILL_OPTOUT, "1");
    saveCustomerDetails({
      name: "Private User",
      phone: "9999999999",
    });

    const saved = getSavedCustomerDetails();
    expect(saved.name).toBe("");
    expect(saved.phone).toBe("");
  });

  it("saves, retrieves, and clears business drafts", () => {
    const draft = {
      businessName: "Apollo Clinic",
      category: "clinic",
      phone: "9820098200",
    };

    saveBusinessDraft(draft);
    expect(getSavedBusinessDraft()).toEqual(draft);

    clearBusinessDraft();
    expect(getSavedBusinessDraft()).toBeNull();
  });

  it("saves and gets preferred role", () => {
    expect(getPreferredRole()).toBeNull();

    savePreferredRole("business");
    expect(getPreferredRole()).toBe("business");

    savePreferredRole("customer");
    expect(getPreferredRole()).toBe("customer");
  });
});
