import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import PitchDemo from "@/pages/PitchDemo";

const renderPitchDemo = () =>
  render(
    <HelmetProvider>
      <BrowserRouter>
        <PitchDemo />
      </BrowserRouter>
    </HelmetProvider>
  );

describe("PitchDemo page interactions", () => {
  it("renders and handles Call Next Patient in default Clinic mode", () => {
    renderPitchDemo();

    expect(screen.getByText(/Live Pitch Simulator/i)).toBeInTheDocument();

    const callNextBtn = screen.getByRole("button", { name: /Call Next Patient/i });
    expect(callNextBtn).toBeInTheDocument();

    // Verify Clinic mode auto-complete badge is present instead of redundant Mark Served button
    expect(screen.queryByRole("button", { name: /^Mark Served$/i })).toBeNull();
    expect(screen.getByText(/Auto-completes on Next Patient/i)).toBeInTheDocument();

    act(() => {
      fireEvent.click(callNextBtn);
    });

    expect(screen.getAllByText(/A-101/i).length).toBeGreaterThan(0);
  });

  it("handles +3 Walk-ins", () => {
    renderPitchDemo();

    const walkInBtn = screen.getByRole("button", { name: /\+3 Walk-ins/i });
    act(() => {
      fireEvent.click(walkInBtn);
    });

    expect(screen.getByText(/3 new walk-ins joined/i)).toBeInTheDocument();
  });

  it("handles Mark Served in non-clinic mode (e.g. Dining & Cafe)", () => {
    renderPitchDemo();

    // Switch to Dining & Cafe where Mark Served is present
    const cafeTab = screen.getByRole("button", { name: /Dining & Cafe/i });
    act(() => {
      fireEvent.click(cafeTab);
    });

    const markServedBtn = screen.getByRole("button", { name: /Mark Served/i });
    expect(markServedBtn).toBeInTheDocument();
    act(() => {
      fireEvent.click(markServedBtn);
    });

    expect(screen.getByText(/marked as served/i)).toBeInTheDocument();
  });

  it("switches industry tabs", () => {
    renderPitchDemo();

    const cafeTab = screen.getByRole("button", { name: /Dining & Cafe/i });
    act(() => {
      fireEvent.click(cafeTab);
    });

    expect(screen.getAllByText(/Blue Harbor Artisan Roastery/i).length).toBeGreaterThan(0);
  });

  it("handles Auto 60s Tour and Reset", () => {
    vi.useFakeTimers();
    renderPitchDemo();

    const tourBtn = screen.getByRole("button", { name: /Auto 60s Tour/i });
    act(() => {
      fireEvent.click(tourBtn);
    });

    expect(screen.getByText(/Step 1:/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByText(/Step 2:/i)).toBeInTheDocument();

    const resetBtn = screen.getByRole("button", { name: /Reset/i });
    act(() => {
      fireEvent.click(resetBtn);
    });

    vi.useRealTimers();
  });
});
