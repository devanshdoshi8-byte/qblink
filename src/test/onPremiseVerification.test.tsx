import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  haversineDistanceMeters,
  verifyOnPremiseEntry,
  generateCounterCode,
  OnPremiseConfig,
} from "@/lib/onPremiseVerification";
import OnPremiseJoiningCard from "@/components/business/OnPremiseJoiningCard";
import OnPremiseVerificationModal from "@/components/queue/OnPremiseVerificationModal";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "Offline in unit test" } }),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        })),
      })),
    })),
  },
}));

describe("On-Premise Verification logic & math", () => {
  it("calculates haversine distance accurately", () => {
    // 0 distance for identical coordinates
    expect(haversineDistanceMeters(19.076, 72.8777, 19.076, 72.8777)).toBe(0);

    // Known approximate distance (~111 km per degree latitude)
    const dist1Deg = haversineDistanceMeters(19.0, 72.0, 20.0, 72.0);
    expect(dist1Deg).toBeGreaterThan(110000);
    expect(dist1Deg).toBeLessThan(112000);

    // Nearby distance (~100-200m)
    const distNear = haversineDistanceMeters(19.076, 72.8777, 19.077, 72.8777);
    expect(distNear).toBeGreaterThan(100);
    expect(distNear).toBeLessThan(150);
  });

  it("generates 4-digit numeric counter codes", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateCounterCode();
      expect(code).toMatch(/^\d{4}$/);
    }
  });

  it("bypasses location check completely when remote joining is ON", async () => {
    const res = await verifyOnPremiseEntry({
      queueId: "test-queue-1",
      remoteJoiningEnabled: true,
    });

    expect(res.allowed).toBe(true);
    expect(res.verified_by).toBe("remote_allowed");
  });

  it("allows entry if customer is within the configured radius (Remote Joining OFF)", async () => {
    const config: OnPremiseConfig = {
      enabled: true,
      radius_meters: 250,
      latitude: 19.076,
      longitude: 72.8777,
      counter_code: "4812",
    };

    // Client within 50 meters
    const res = await verifyOnPremiseEntry({
      queueId: "test-queue-1",
      latitude: 19.0762,
      longitude: 72.8777,
      clientFallbackConfig: config,
      remoteJoiningEnabled: false,
    });

    expect(res.allowed).toBe(true);
    expect(res.verified_by).toBe("geofence");
    expect(res.distance_meters).toBeLessThanOrEqual(250);
  });

  it("rejects location and offers code when customer is outside radius (Remote Joining OFF)", async () => {
    const config: OnPremiseConfig = {
      enabled: true,
      radius_meters: 250,
      latitude: 19.076,
      longitude: 72.8777,
      counter_code: "4812",
    };

    // Client 2 km away
    const res = await verifyOnPremiseEntry({
      queueId: "test-queue-1",
      latitude: 19.096,
      longitude: 72.8777,
      clientFallbackConfig: config,
      remoteJoiningEnabled: false,
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("outside_radius");
  });

  it("validates counter code fallback successfully", async () => {
    const config: OnPremiseConfig = {
      enabled: true,
      radius_meters: 250,
      latitude: 19.076,
      longitude: 72.8777,
      counter_code: "4812",
    };

    // Valid code
    const resValid = await verifyOnPremiseEntry({
      queueId: "test-queue-1",
      counterCode: "4812",
      clientFallbackConfig: config,
      remoteJoiningEnabled: false,
    });
    expect(resValid.allowed).toBe(true);
    expect(resValid.verified_by).toBe("counter_code");

    // Invalid code
    const resInvalid = await verifyOnPremiseEntry({
      queueId: "test-queue-1",
      counterCode: "9999",
      clientFallbackConfig: config,
      remoteJoiningEnabled: false,
    });
    expect(resInvalid.allowed).toBe(false);
    expect(resInvalid.reason).toBe("invalid_counter_code");
  });
});

describe("OnPremiseJoiningCard component", () => {
  it("renders the refined business settings copy and optional badge", () => {
    const config: OnPremiseConfig = {
      enabled: true,
      radius_meters: 250,
      latitude: 19.076,
      longitude: 72.8777,
      counter_code: "4812",
    };

    render(
      <OnPremiseJoiningCard
        remoteJoiningEnabled={false}
        config={config}
        onSave={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText("On-Premise Joining")).toBeInTheDocument();
    expect(screen.getByText("Optional")).toBeInTheDocument();
    expect(screen.getByText("What is it?")).toBeInTheDocument();
    expect(screen.getByText("How does it work?")).toBeInTheDocument();
    expect(screen.getByText("What does it help prevent?")).toBeInTheDocument();
    expect(screen.getByText(/Only applies when Remote Joining is OFF/i)).toBeInTheDocument();
    expect(screen.getByText("4812")).toBeInTheDocument();
  });
});

describe("OnPremiseVerificationModal component", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("renders verification options and allows counter code entry", async () => {
    const user = userEvent.setup();
    const config: OnPremiseConfig = {
      enabled: true,
      radius_meters: 250,
      latitude: 19.076,
      longitude: 72.8777,
      counter_code: "7788",
    };

    const onVerified = vi.fn();
    const onClose = vi.fn();

    render(
      <OnPremiseVerificationModal
        isOpen={true}
        onClose={onClose}
        queueId="test-queue"
        businessName="City Care Clinic"
        config={config}
        onVerified={onVerified}
      />
    );

    expect(screen.getByText(/Verify You're at the Business/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Verify My Location/i })).toBeInTheDocument();

    // Click counter code fallback
    await user.click(screen.getByText(/Or enter 4-digit Counter Code/i));

    expect(screen.getByText("Enter Counter Code")).toBeInTheDocument();
    const input = screen.getByPlaceholderText("4-digit code");

    // Type code and submit
    await user.type(input, "7788");
    await user.click(screen.getByRole("button", { name: /Verify Code & Join Queue/i }));

    await waitFor(() => {
      expect(onVerified).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
