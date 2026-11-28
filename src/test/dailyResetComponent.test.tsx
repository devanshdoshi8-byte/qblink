import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DailyResetCard from "@/components/business/DailyResetCard";
import { supabase } from "@/integrations/supabase/client";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => {
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });

  const selectMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          settings: {
            daily_reset: {
              enabled: true,
              time: "00:00",
              timezone: "Asia/Kolkata",
              only_if_active: true,
            },
          },
        },
        error: null,
      }),
    }),
  });

  return {
    supabase: {
      from: vi.fn((table: string) => {
        if (table === "businesses") {
          return {
            select: selectMock,
            update: updateMock,
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
      rpc: vi.fn().mockResolvedValue({
        data: { ok: true, reset: true, timezone: "Asia/Kolkata" },
        error: null,
      }),
    },
  };
});

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("DailyResetCard component integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loaded settings with active status pill and explanations", async () => {
    render(<DailyResetCard businessId="biz-123" />);

    // Check title and description
    expect(screen.getByText("Daily Queue Reset & Schedule")).toBeInTheDocument();

    // Wait for data load and component body to finish rendering
    await screen.findByText("Token #1 Reset");

    expect(screen.getByText(/Auto-resets at 12:00 AM/i)).toBeInTheDocument();
    expect(screen.getByText("Session Archived")).toBeInTheDocument();
    expect(screen.getByText("No-Show Cleanup")).toBeInTheDocument();
    expect(screen.getByText("100% Automated")).toBeInTheDocument();
  });

  it("allows toggling auto-reset off and on, updating UI state", async () => {
    const user = userEvent.setup();
    render(<DailyResetCard businessId="biz-123" />);

    // Wait for component body to finish rendering
    const toggle = await screen.findByRole("checkbox", { name: /automated daily reset/i });
    expect(toggle).toBeChecked();

    // Toggle off
    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(/Manual Mode \(Paused\)/i)).toBeInTheDocument();

    // Toggle back on
    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(screen.getByText(/Auto-resets at 12:00 AM/i)).toBeInTheDocument();
  });

  it("allows changing scheduled reset time preset and custom time", async () => {
    const user = userEvent.setup();
    render(<DailyResetCard businessId="biz-123" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue(/12:00 AM \(Midnight\)/i)).toBeInTheDocument();
    });

    // Change to 11:00 PM preset
    const select = screen.getByRole("combobox", { name: /scheduled reset time/i });
    fireEvent.change(select, { target: { value: "23:00" } });

    await waitFor(() => {
      expect(screen.getByText(/Auto-resets at 11:00 PM/i)).toBeInTheDocument();
    });

    // Switch to custom time mode
    const customBtn = screen.getByText("Custom time");
    await user.click(customBtn);

    // Expect time input to appear
    const timeInput = screen.getByDisplayValue("23:00");
    expect(timeInput).toBeInTheDocument();

    fireEvent.change(timeInput, { target: { value: "03:30" } });
    await waitFor(() => {
      expect(screen.getByText(/Auto-resets at 3:30 AM/i)).toBeInTheDocument();
    });
  });

  it("saves updated configuration to Supabase business settings", async () => {
    const user = userEvent.setup();
    render(<DailyResetCard businessId="biz-123" />);

    await waitFor(() => {
      expect(screen.getByText("Save Schedule")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save schedule/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("businesses");
    });
  });
});
