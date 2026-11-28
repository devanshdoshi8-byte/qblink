/**
 * Robust cookie and local storage persistence utility for Qblink.
 *
 * Ensures user details (customer name, phone, email, last role, draft inputs)
 * persist across browser restarts, mobile in-app webviews (WhatsApp, Instagram, Telegram),
 * and page reloads so users never have to re-enter details repeatedly.
 */

const DEFAULT_EXPIRY_DAYS = 365;

/** Set a persistent cookie with localStorage synchronization */
export function setCookie(name: string, value: string, days = DEFAULT_EXPIRY_DAYS): void {
  if (typeof document === "undefined") return;

  try {
    const encodedValue = encodeURIComponent(value);
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";

    document.cookie = `${name}=${encodedValue}${expires}; path=/; SameSite=Lax${secure}`;
  } catch {
    // Ignore cookie write errors (e.g. sandbox restrictions)
  }

  // Multi-tier storage: sync with localStorage as reliable backup
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(name, value);
    }
  } catch {
    // Ignore localStorage quota or private browsing exceptions
  }
}

/** Get cookie with localStorage fallback and automatic self-healing sync */
export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  try {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        const val = decodeURIComponent(c.substring(nameEQ.length, c.length));
        return val;
      }
    }
  } catch {
    // Fallback to localStorage below
  }

  // Fallback to localStorage if cookie was blocked or cleared
  try {
    if (typeof localStorage !== "undefined") {
      const localVal = localStorage.getItem(name);
      if (localVal) {
        // Self-healing: re-seed the cookie for future requests
        try {
          setCookie(name, localVal);
        } catch {}
        return localVal;
      }
    }
  } catch {
    // Ignore private browsing exceptions
  }

  return null;
}

/** Remove cookie and delete from localStorage */
export function removeCookie(name: string): void {
  if (typeof document !== "undefined") {
    try {
      const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure}`;
    } catch {}
  }

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(name);
    }
  } catch {}
}

/* -------------------------------------------------------------------------- */
/* Specialized User Profile & Form Memory Helpers                             */
/* -------------------------------------------------------------------------- */

export const COOKIE_KEYS = {
  VISITOR_NAME: "qb_visitor_name",
  VISITOR_PHONE: "qb_visitor_phone",
  USER_EMAIL: "qb_user_email",
  LAST_ROLE: "qb_last_role",
  TICKET_LANGUAGE: "qb_ticket_language",
  BUSINESS_DRAFT: "qb_business_draft",
  PREFILL_OPTOUT: "qb_prefill_optout",
} as const;

export interface CustomerSavedProfile {
  name: string;
  phone: string;
  email: string;
}

/** Save customer / visitor details into cookies and localStorage */
export function saveCustomerDetails(details: {
  name?: string;
  phone?: string;
  email?: string;
}): void {
  if (getCookie(COOKIE_KEYS.PREFILL_OPTOUT) === "1") return;

  if (details.name && details.name.trim()) {
    setCookie(COOKIE_KEYS.VISITOR_NAME, details.name.trim());
  }
  if (details.phone && details.phone.trim()) {
    setCookie(COOKIE_KEYS.VISITOR_PHONE, details.phone.trim());
  }
  if (details.email && details.email.trim()) {
    setCookie(COOKIE_KEYS.USER_EMAIL, details.email.trim().toLowerCase());
  }
}

/** Retrieve customer details stored in cookies / localStorage */
export function getSavedCustomerDetails(): CustomerSavedProfile {
  if (getCookie(COOKIE_KEYS.PREFILL_OPTOUT) === "1") {
    return { name: "", phone: "", email: "" };
  }

  return {
    name: getCookie(COOKIE_KEYS.VISITOR_NAME) || "",
    phone: getCookie(COOKIE_KEYS.VISITOR_PHONE) || "",
    email: getCookie(COOKIE_KEYS.USER_EMAIL) || "",
  };
}

/** Save business draft so registration details are never lost on refresh */
export function saveBusinessDraft(draft: Record<string, unknown>): void {
  try {
    const serialized = JSON.stringify(draft);
    setCookie(COOKIE_KEYS.BUSINESS_DRAFT, serialized, 30);
  } catch {}
}

/** Retrieve saved business registration draft */
export function getSavedBusinessDraft<T = Record<string, unknown>>(): T | null {
  try {
    const raw = getCookie(COOKIE_KEYS.BUSINESS_DRAFT);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Clear business draft after successful registration */
export function clearBusinessDraft(): void {
  removeCookie(COOKIE_KEYS.BUSINESS_DRAFT);
}

/** Save preferred role (customer vs business) */
export function savePreferredRole(role: "customer" | "business"): void {
  setCookie(COOKIE_KEYS.LAST_ROLE, role);
}

/** Get preferred role */
export function getPreferredRole(): "customer" | "business" | null {
  const role = getCookie(COOKIE_KEYS.LAST_ROLE);
  return role === "customer" || role === "business" ? role : null;
}
