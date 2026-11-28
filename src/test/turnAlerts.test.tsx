import { act, renderHook, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTurnAlerts } from "@/hooks/useTurnAlerts";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("opt-in turn alerts", () => {
  function setup() {
    const start = vi.fn();
    const release = vi.fn().mockResolvedValue(undefined);
    const request = vi.fn().mockResolvedValue({ release, addEventListener: vi.fn() });
    const parameter = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
    class Audio {
      state = "running"; currentTime = 0; destination = {};
      resume = vi.fn().mockResolvedValue(undefined); close = vi.fn().mockResolvedValue(undefined);
      createOscillator = () => ({ frequency: {}, connect: () => ({ connect: vi.fn() }), start, stop: vi.fn(), disconnect: vi.fn() });
      createGain = () => ({ gain: parameter, connect: vi.fn(), disconnect: vi.fn() });
    }
    vi.stubGlobal("AudioContext", Audio);
    Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request } });
    return { start, request, release };
  }
  it("does not play or request screen wake before consent", () => {
    const { start, request } = setup();
    const { rerender } = renderHook(({ status }) => useTurnAlerts(status, true), { initialProps: { status: "waiting" } });
    rerender({ status: "called" });
    expect(start).not.toHaveBeenCalled(); expect(request).not.toHaveBeenCalled();
  });
  it("plays one chime per call transition, releases wake lock on opt-out", async () => {
    const { start, release } = setup();
    const { result, rerender } = renderHook(({ status }) => useTurnAlerts(status, true), { initialProps: { status: "waiting" } });
    await act(async () => { await result.current.toggle(true); });
    await waitFor(() => expect(result.current.wakeState).toBe("active"));
    expect(start).toHaveBeenCalledTimes(4);
    rerender({ status: "called" });
    await waitFor(() => expect(start).toHaveBeenCalledTimes(8));
    rerender({ status: "called" });
    expect(start).toHaveBeenCalledTimes(8);
    await act(async () => { await result.current.toggle(false); });
    expect(release).toHaveBeenCalled();
    expect(result.current.enabled).toBe(false);
  });
  it("reports unavailable wake lock without disabling sound", async () => {
    setup(); Object.defineProperty(navigator, "wakeLock", { configurable: true, value: undefined });
    const { result } = renderHook(() => useTurnAlerts("waiting", true));
    await act(async () => { await result.current.toggle(true); });
    expect(result.current.enabled).toBe(true);
    expect(result.current.wakeState).toBe("unavailable");
  });
});