// Text-to-speech chime and announcer for the live simulator and TV display

let lastAnnouncement = "";
let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playAirportChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getContext();
      if (!ctx) {
        resolve();
        return;
      }
      const now = ctx.currentTime;
      [
        { freq: 523.25, time: now, duration: 0.25 },
        { freq: 659.25, time: now + 0.18, duration: 0.25 },
        { freq: 783.99, time: now + 0.36, duration: 0.45 },
        { freq: 1046.5, time: now + 0.54, duration: 0.6 },
      ].forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.001, time);
        gain.gain.exponentialRampToValueAtTime(0.18, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      });
      setTimeout(resolve, 800);
    } catch {
      resolve();
    }
  });
}

export function announceToken({
  tokenNumber,
  queueName,
  counterLabel,
  queueType = "standard",
  enabled = false,
}: {
  tokenNumber: string;
  queueName?: string;
  counterLabel?: string;
  queueType?: string;
  enabled?: boolean;
}) {
  if (!enabled || !tokenNumber || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  const key = `${tokenNumber}-${counterLabel || "default"}`;
  if (lastAnnouncement !== key) {
    lastAnnouncement = key;
    playAirportChime().catch(() => {});
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      let text = `Attention please: Token number ${tokenNumber}.`;
      if (queueType === "restaurant") {
        text = `Attention please: Token number ${tokenNumber}, your table is ready. ${
          counterLabel ? `Please proceed to ${counterLabel}.` : "Please proceed to the host desk."
        }`;
      } else if (counterLabel) {
        text = `Attention please: Token number ${tokenNumber}, please proceed to ${counterLabel}.`;
      } else {
        text = `Now serving: Token number ${tokenNumber}.`;
      }
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.92;
      utter.pitch = 1.05;
      utter.lang = "en-US";
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("Speech synthesis announcement skipped:", e);
    }
  }
}
