"use client";

// Small helper around localStorage-backed arrays, designed for
// React's useSyncExternalStore — the recommended pattern for syncing
// component state with an external browser API without triggering
// cascading-render issues from setState-in-effect.

const listeners = new Map<string, Set<() => void>>();
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();
const EMPTY: never[] = [];

function notify(key: string) {
  listeners.get(key)?.forEach((cb) => cb());
}

export function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T[];

  let value: T[];
  try {
    value = raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    value = [];
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

export function writeArray<T>(key: string, value: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private browsing, etc.) — fail silently.
  }
  snapshotCache.delete(key);
  notify(key);
}

export function getServerSnapshot<T>(): T[] {
  return EMPTY as T[];
}

/** Same caching/read logic as readArray, but for a single JSON value (e.g. a session object) rather than a list. */
export function readValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value: T;
  try {
    value = raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    value = fallback;
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

/** Pass `null` to remove the key (e.g. clearing a session on logout). */
export function writeValue<T>(key: string, value: T | null) {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // localStorage unavailable (private browsing, etc.) — fail silently.
  }
  snapshotCache.delete(key);
  notify(key);
}

export function subscribe(key: string, callback: () => void): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(callback);

  function onStorage(e: StorageEvent) {
    if (e.key === key) callback();
  }
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.get(key)?.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}
