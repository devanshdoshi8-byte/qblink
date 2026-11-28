/**
 * Pure Web Audio API Hospital/Clinic Queue Chime
 * Synthesizes a soothing, audible two-tone/three-tone hospital chime
 * without requiring any external MP3/WAV file downloads.
 */

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

/**
 * Checks whether audio context is allowed to play sound without browser blocking.
 */
export function isAudioAllowed(): boolean {
  if (!sharedAudioCtx) return false;
  return sharedAudioCtx.state === "running";
}

/**
 * Resumes audio context on user gesture.
 */
export async function unlockAudio(): Promise<boolean> {
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === "running";
}

/**
 * Plays a classic clinic chime: Ding-Dong (C5 -> G4 or E5 -> C5)
 * with exponential volume decay.
 */
export async function playClinicChime(volume = 0.5): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return;
    }
  }

  const now = ctx.currentTime;

  // Tone 1: High harmonic bell (659.25 Hz - E5)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(659.25, now);
  gain1.gain.setValueAtTime(volume * 0.7, now);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.85);

  // Tone 2: Warm fundamental chime (523.25 Hz - C5) after 200ms
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(523.25, now + 0.22);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.setValueAtTime(volume, now + 0.22);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.22);
  osc2.stop(now + 1.25);
}

/**
 * Speaks out the token number aloud using SpeechSynthesis if available.
 */
export function announceTokenVoice(tokenNumber: number, queueName?: string, lang = "en-IN"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const text = queueName
      ? `Token number ${tokenNumber}, for ${queueName}.`
      : `Token number ${tokenNumber}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully ignore voice synthesis restrictions
  }
}

const AUDIO_STORAGE_KEY = "qblink:staffAudioEnabled";

export const isStaffAudioEnabled = (): boolean => {
  try {
    const item = localStorage.getItem(AUDIO_STORAGE_KEY);
    return item === null ? true : item === "true";
  } catch {
    return true;
  }
};

export const setStaffAudioEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, String(enabled));
  } catch {
    // ignore storage errors
  }
};

export const playArrivalChime = (): void => {
  if (!isStaffAudioEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.12, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.38);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.14, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.58);
  } catch {
    // ignore audio restrictions
  }
};

export const playCallNextChime = (): void => {
  if (!isStaffAudioEnabled()) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const notes = [659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const start = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch {
    // ignore audio restrictions
  }
};
