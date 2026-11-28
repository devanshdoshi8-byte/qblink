/** Explicit in-app parents also work for QR links and fresh browser tabs. */
export const backDestination = (pathname: string): string => {
  if (pathname.startsWith("/auth/") && pathname !== "/auth/forgot-password") return "/auth";
  if (pathname === "/auth/forgot-password") return "/auth/signin";
  if (pathname.startsWith("/customer-dashboard/")) return "/customer-dashboard";
  if (pathname.startsWith("/dashboard/")) return "/dashboard";
  if (pathname.startsWith("/admin/")) return "/admin";
  return "/";
};