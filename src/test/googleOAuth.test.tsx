import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

const mockSignInWithOAuth = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithOAuth: (...args: any[]) => mockSignInWithOAuth(...args),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          limit: () => Promise.resolve({ data: [] }),
        }),
      }),
    })),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
}));

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({ roles: [], loading: false }),
}));

vi.mock("@/hooks/useIsAdmin", () => ({
  useIsAdmin: () => ({ isAdmin: false, loading: false }),
}));

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import SignIn from "@/pages/SignIn";
import CustomerSignUp from "@/pages/CustomerSignUp";
import BusinessSignUp from "@/pages/BusinessSignUp";
import { getPending } from "@/lib/auth/pendingAuth";

const renderWithProviders = (ui: React.ReactElement, initialEntry = "/") =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
    </HelmetProvider>
  );

describe("Google OAuth Sign-In Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    mockSignInWithOAuth.mockResolvedValue({ data: { provider: "google", url: "https://accounts.google.com" }, error: null });
  });

  it("GoogleSignInButton calls supabase.auth.signInWithOAuth with /dashboard redirectTo", async () => {
    renderWithProviders(<GoogleSignInButton />);
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
    });
  });

  it("GoogleSignInButton surfaces error and re-enables button when OAuth fails", async () => {
    const onError = vi.fn();
    mockSignInWithOAuth.mockResolvedValueOnce({ data: { provider: "google", url: null }, error: { message: "Provider not enabled" } });

    renderWithProviders(<GoogleSignInButton onError={onError} />);
    const btn = screen.getByRole("button", { name: /continue with google/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith("Provider not enabled");
    });
    expect(btn).not.toBeDisabled();
  });

  it("SignIn renders Continue with Google and preserves safe next param", async () => {
    renderWithProviders(<SignIn />, "/auth/signin?next=/join/queue-1");
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
    });
    expect(getPending("next")).toBe("/join/queue-1");
  });

  it("CustomerSignUp renders Continue with Google and sets pending customer role", async () => {
    renderWithProviders(<CustomerSignUp />, "/auth/customer");
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
    });
    expect(getPending("role")).toBe("customer");
  });

  it("BusinessSignUp renders Continue with Google and sets pending business role", async () => {
    renderWithProviders(<BusinessSignUp />, "/auth/business");
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
    });
    expect(getPending("role")).toBe("business");
  });
});
