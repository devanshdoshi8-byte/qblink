export type AppRoleName = "customer" | "business" | "admin";

const LAST_MODE_KEY = "qblink_last_mode";

export function getLastActiveMode(): AppRoleName | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(LAST_MODE_KEY);
    return v === "customer" || v === "business" || v === "admin" ? (v as AppRoleName) : null;
  } catch {
    return null;
  }
}

export function setLastActiveMode(mode: AppRoleName): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_MODE_KEY, mode);
  } catch {
    /* ignore storage quota / private browsing errors */
  }
}

/** One account can hold several roles; pick the main one for default routing. */
export function primaryRole(roles: string[]): AppRoleName | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("business")) return "business";
  if (roles.includes("customer")) return "customer";
  return null;
}

/** Where a signed-in user should land, given their roles and what they asked for. */
export function destinationFor(
  roles: string[],
  intent: "customer" | "business" | "auto",
  isAdmin: boolean,
): string {
  if (intent === "business") return "/dashboard";
  if (intent === "customer") return "/customer-dashboard";
  if (isAdmin) return "/admin";
  if (roles.includes("business")) return "/dashboard";
  return "/customer-dashboard";
}

/**
 * Resolves the target dashboard for a logged-in user according to the playbook:
 * - Single role: business -> /dashboard, customer -> /customer-dashboard, admin -> /admin
 * - Multiple roles: reads qblink_last_mode from localStorage; if valid, routes there;
 *   otherwise defaults to /dashboard if they have a business role, else /customer-dashboard, else /admin.
 */
export function resolveUserDashboard(
  roles: string[],
  isAdmin: boolean,
  lastMode: string | null = getLastActiveMode(),
): string {
  const allRoles: string[] = [...roles];
  if (isAdmin && !allRoles.includes("admin")) {
    allRoles.push("admin");
  }

  // If no roles detected yet, fallback to customer-dashboard
  if (allRoles.length === 0) {
    return "/customer-dashboard";
  }

  // Single role handling
  if (allRoles.length === 1) {
    if (allRoles[0] === "admin") return "/admin";
    if (allRoles[0] === "business") return "/dashboard";
    if (allRoles[0] === "customer") return "/customer-dashboard";
  }

  // Multiple roles handling
  if (lastMode) {
    if (lastMode === "admin" && (allRoles.includes("admin") || isAdmin)) {
      return "/admin";
    }
    if (lastMode === "business" && allRoles.includes("business")) {
      return "/dashboard";
    }
    if (lastMode === "customer" && allRoles.includes("customer")) {
      return "/customer-dashboard";
    }
  }

  // Default when multiple roles exist and no valid lastMode:
  // "defaulting to /dashboard if they own a business"
  if (allRoles.includes("business")) {
    return "/dashboard";
  }
  if (allRoles.includes("customer")) {
    return "/customer-dashboard";
  }
  if (allRoles.includes("admin") || isAdmin) {
    return "/admin";
  }
  return "/customer-dashboard";
}

