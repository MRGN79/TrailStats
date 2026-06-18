const KEY = "trailstats.adConsent";

export type ConsentState = "accepted" | "rejected" | null;

export function loadAdConsent(): ConsentState {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "accepted" || v === "rejected") return v;
  } catch { /* localStorage blocked in private/incognito mode */ }
  return null;
}

export function saveAdConsent(state: "accepted" | "rejected"): void {
  try {
    localStorage.setItem(KEY, state);
  } catch { /* localStorage blocked in private/incognito mode */ }
}

export function resetAdConsent(): void {
  try {
    localStorage.removeItem(KEY);
  } catch { /* localStorage blocked in private/incognito mode */ }
}

export function loadAdSenseScript(publisherId: string): void {
  if (document.querySelector('script[src*="adsbygoogle.js"]')) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
}
