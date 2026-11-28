import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RoiCalculator } from "./RoiCalculator";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const mount = (initialIndustry?: "salon") => render(
  <MemoryRouter><RoiCalculator initialIndustry={initialIndustry} /></MemoryRouter>,
);
const numberInput = (name: string) => screen.getByRole("spinbutton", { name });
const copy = () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
  fireEvent.click(screen.getByRole("button", { name: /Copy Scenario Digest|Copied Scenario Summary/ }));
  return String(writeText.mock.calls[0]?.[0]);
};
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("ROI calculator behaviour", () => {
  it("preserves clinic defaults, intermediate rounding and annual projections", () => {
    mount();
    expect(numberInput("Daily Patients")).toHaveValue(80);
    const digest = copy();
    expect(digest).toContain("Illustrative Annual Revenue Exposure: ₹17.97 Lakh");
    expect(digest).toContain("Illustrative Monthly Revenue Exposure: ₹1.50 Lakh");
    expect(digest).toContain("Estimated Monthly Lost Daily Patients: 260");
    expect(digest).toContain("Potential Annual Opportunity Addressed: ₹8.99 Lakh");
    expect(digest).toContain("Potential Monthly Retained Daily Patients: 125");
  });

  it.each([
    ["Dining & F&B", "Daily Dining Guests", 150, 450, 15, 7, 28],
    ["Salon & Spa", "Daily Salon Visitors", 45, 850, 10, 4, 26],
    ["Diagnostic Lab", "Daily Lab Patients", 100, 1200, 8, 3, 26],
    ["Retail Store", "Daily Store Walk-ins", 200, 350, 14, 6, 30],
    ["Custom Business", "Daily Walk-in Visitors", 120, 500, 10, 5, 26],
  ] as const)("retains %s presets and restores them on reset", (label, visitors, daily, value, current, target, days) => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(label) }));
    expect(numberInput(visitors)).toHaveValue(daily);
    expect(screen.getAllByRole("spinbutton")[1]).toHaveValue(value);
    expect(screen.getByRole("slider", { name: "Estimated Queue Walkaway Rate" })).toHaveValue(String(current));
    expect(screen.getByRole("slider", { name: "Scenario Target Walkaway Rate" })).toHaveValue(String(target));
    expect(screen.getByRole("combobox")).toHaveValue(String(days));
    fireEvent.change(numberInput(visitors), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("button", { name: "Reset Defaults" }));
    expect(numberInput(visitors)).toHaveValue(daily);
  });

  it("recalculates edited numbers, sliders and operating days without currency conversion", () => {
    mount();
    fireEvent.change(numberInput("Daily Patients"), { target: { value: "100" } });
    fireEvent.change(numberInput("Avg. Patient Fee / Ticket"), { target: { value: "500" } });
    fireEvent.change(screen.getByRole("slider", { name: "Estimated Queue Walkaway Rate" }), { target: { value: "10" } });
    fireEvent.change(screen.getByRole("slider", { name: "Scenario Target Walkaway Rate" }), { target: { value: "5" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "22" } });
    fireEvent.click(screen.getByRole("button", { name: "$ USD" }));
    const digest = copy();
    expect(digest).toContain("Illustrative Annual Revenue Exposure: $1.32M");
    expect(digest).toContain("Potential Annual Opportunity Addressed: $660.0k");
    expect(digest).toContain("Potential Monthly Retained Daily Patients: 110");
  });

  it("clamps calculated target to current rate and handles empty and negative inputs", () => {
    mount();
    fireEvent.change(screen.getByRole("slider", { name: "Estimated Queue Walkaway Rate" }), { target: { value: "3" } });
    expect(copy()).toContain("Potential Annual Opportunity Addressed: ₹0");
    fireEvent.change(numberInput("Daily Patients"), { target: { value: "-10" } });
    expect(copy()).toContain("Illustrative Annual Revenue Exposure: ₹0");
    fireEvent.change(numberInput("Daily Patients"), { target: { value: "" } });
    expect(copy()).toContain("Estimated Monthly Lost Daily Patients: 0");
  });

  it("honours initial industry and restores the copy action after three seconds", () => {
    vi.useFakeTimers();
    mount("salon");
    expect(numberInput("Daily Salon Visitors")).toHaveValue(45);
    expect(copy()).toContain("Daily Daily Salon Visitors: 45");
    expect(screen.getByRole("button", { name: "Copied Scenario Summary" })).toBeEnabled();
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.getByRole("button", { name: "Copy Scenario Digest" })).toBeEnabled();
  });
});
