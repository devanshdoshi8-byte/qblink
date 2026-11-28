import { useCallback, useEffect, useRef, useState } from "react";

type ScreenLock = { release: () => Promise<void>; addEventListener: (type: string, listener: () => void) => void };
type WakeNavigator = Navigator & { wakeLock?: { request: (type: "screen") => Promise<ScreenLock> } };

export function useTurnAlerts(status: string, active: boolean) {
  const [enabled, setEnabled] = useState(false);
  const [wakeState, setWakeState] = useState<"off" | "active" | "unavailable">("off");
  const [audioError, setAudioError] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const previous = useRef(status);

  const play = useCallback(async () => {
    const context = audio.current;
    if (!context) return;
    try {
      await context.resume();
      if (context.state !== "running") throw new Error("Audio unavailable");
      [880, 1175, 1568, 1175].forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = context.currentTime + index * 0.25;
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.35, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.45);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
      setAudioError(false);
    } catch { setAudioError(true); }
  }, []);

  const toggle = async (next: boolean) => {
    setAudioError(false);
    if (!next) { setEnabled(false); return; }
    try {
      const Audio = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) throw new Error("Unsupported audio");
      audio.current ??= new Audio();
      await audio.current.resume();
      if (audio.current.state !== "running") throw new Error("Audio blocked");
      setEnabled(true);
      await play();
    } catch { setAudioError(true); setEnabled(false); }
  };

  useEffect(() => {
    if (active && enabled && status === "called" && previous.current !== "called") {
      void play();
      navigator.vibrate?.([200, 80, 200]);
    }
    previous.current = status;
  }, [status, enabled, active, play]);

  useEffect(() => {
    let disposed = false;
    let lock: ScreenLock | null = null;
    let requesting = false;
    setWakeState("off");
    if (!enabled || !active || !["waiting", "called", "serving"].includes(status)) return;
    const acquire = async () => {
      if (document.visibilityState !== "visible" || requesting || lock) return;
      const wake = (navigator as WakeNavigator).wakeLock;
      if (!wake) { setWakeState("unavailable"); return; }
      requesting = true;
      try {
        const next = await wake.request("screen");
        if (disposed) { await next.release(); return; }
        lock = next;
        setWakeState("active");
        next.addEventListener("release", () => { if (lock === next) lock = null; if (!disposed) setWakeState("off"); });
      } catch { if (!disposed) setWakeState("unavailable"); }
      finally { requesting = false; }
    };
    const onVisibility = () => { if (document.visibilityState === "visible") void acquire(); };
    void acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { disposed = true; document.removeEventListener("visibilitychange", onVisibility); void lock?.release(); };
  }, [enabled, active, status]);

  useEffect(() => () => { void audio.current?.close(); }, []);
  return { enabled, toggle, play, wakeState, audioError };
}