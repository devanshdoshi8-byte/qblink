/**
 * Small store for pending auth intents (role, next path, business drafts).
 * Uses localStorage with a TTL so a stale intent never hijacks a later visit.
 */
const TTL_MS = 30 * 60 * 1000;
const PREFIX = "qblink.pending.";

export type PendingKey = "role" | "next" | "business";

export function setPending(key: PendingKey, value: string): void {
  const payload = JSON.stringify({ v: value, t: Date.now() });
  try { localStorage.setItem(PREFIX + key, payload); } catch { /* ignore */ }
  try { sessionStorage.setItem(PREFIX + key, payload); } catch { /* ignore */ }
}

function read(storage: Storage | undefined, key: PendingKey): string | null {
  try {
    const raw = storage?.getItem(PREFIX + key);
    if (!raw) return null;
    const { v, t } = JSON.parse(raw) as { v: string; t: number };
    if (typeof t !== "number" || Date.now() - t > TTL_MS) {
      storage?.removeItem(PREFIX + key);
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

export function getPending(key: PendingKey): string | null {
  let s: Storage | undefined;
  let l: Storage | undefined;
  try { s = sessionStorage; } catch { /* ignore */ }
  try { l = localStorage; } catch { /* ignore */ }
  return read(s, key) ?? read(l, key);
}

export function clearPending(key: PendingKey): void {
  try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
  try { sessionStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
}

export function clearAllPending(): void {
  (["role", "next", "business"] as PendingKey[]).forEach(clearPending);
}
