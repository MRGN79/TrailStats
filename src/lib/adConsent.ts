const KEY = "trailstats-ad-consent";

export type ConsentState = "accepted" | "rejected" | null;

export function loadAdConsent(): ConsentState {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "accepted" || v === "rejected") return v;
  } catch {}
  return null;
}

export function saveAdConsent(state: "accepted" | "rejected"): void {
  try {
    localStorage.setItem(KEY, state);
  } catch {}
}
