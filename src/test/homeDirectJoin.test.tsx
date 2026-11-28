import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Hero } from "@/components/qb/Hero";
import { getPreferredRole } from "@/lib/storage/cookieStorage";

// Mock useAuth & useUserRole
let mockUser: any = null;
let mockRoles: string[] = [];

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}));

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({ roles: mockRoles, loading: false }),
}));

describe("Hero direct Join buttons & role memory", () => {
  beforeEach(() => {
    mockUser = null;
    mockRoles = [];
    localStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  });

  it("renders both Join as a Customer and Join as a Business buttons for unauthenticated visitors", () => {
    render(
      <BrowserRouter>
        <Hero />
      </BrowserRouter>
    );

    const customerBtn = screen.getByRole("link", { name: /join as a customer/i });
    const businessBtn = screen.getByRole("link", { name: /join as a business/i });

    expect(customerBtn).toBeInTheDocument();
    expect(customerBtn).toHaveAttribute("href", "/auth/customer");

    expect(businessBtn).toBeInTheDocument();
    expect(businessBtn).toHaveAttribute("href", "/auth/business");
  });

  it("stores preferred role into cookies upon clicking Join buttons", () => {
    render(
      <BrowserRouter>
        <Hero />
      </BrowserRouter>
    );

    const customerBtn = screen.getByRole("link", { name: /join as a customer/i });
    fireEvent.click(customerBtn);
    expect(getPreferredRole()).toBe("customer");

    const businessBtn = screen.getByRole("link", { name: /join as a business/i });
    fireEvent.click(businessBtn);
    expect(getPreferredRole()).toBe("business");
  });

  it("routes logged-in business owner directly to /dashboard without intermediate clicks", () => {
    mockUser = { id: "test-biz-owner", email: "owner@clinic.com" };
    mockRoles = ["business"];

    render(
      <BrowserRouter>
        <Hero />
      </BrowserRouter>
    );

    const businessBtn = screen.getByRole("link", { name: /join as a business/i });
    expect(businessBtn).toHaveAttribute("href", "/dashboard");
  });

  it("routes logged-in customer directly to /customer-dashboard without intermediate clicks", () => {
    mockUser = { id: "test-customer", email: "patient@gmail.com" };
    mockRoles = ["customer"];

    render(
      <BrowserRouter>
        <Hero />
      </BrowserRouter>
    );

    const customerBtn = screen.getByRole("link", { name: /join as a customer/i });
    expect(customerBtn).toHaveAttribute("href", "/customer-dashboard");
  });
});
