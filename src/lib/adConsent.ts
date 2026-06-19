const KEY = "trailstats.adConsent";
const LEGACY_KEY = "trailstats-ad-consent";
const SESSION_KEY = "trailstats.adConsent.session";

export type ConsentState = "accepted" | "rejected" | null;

export function loadAdConsent(): ConsentState {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === "accepted" || legacy === "rejected") {
      try { localStorage.setItem(KEY, legacy); localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
      return legacy;
    }
    const v = localStorage.getItem(KEY);
    if (v === "accepted" || v === "rejected") return v;
  } catch { /* localStorage blocked in private/incognito mode */ }
  try {
    const sv = sessionStorage.getItem(SESSION_KEY);
    if (sv === "accepted" || sv === "rejected") return sv;
  } catch { /* sessionStorage also blocked */ }
  return null;
}

export function saveAdConsent(state: "accepted" | "rejected"): void {
  try {
    localStorage.setItem(KEY, state);
    return;
  } catch { /* localStorage blocked in private/incognito mode */ }
  try {
    sessionStorage.setItem(SESSION_KEY, state);
  } catch { /* sessionStorage also blocked */ }
}

export function resetAdConsent(): void {
  try { localStorage.removeItem(KEY); } catch { /* localStorage blocked in private/incognito mode */ }
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* sessionStorage also blocked */ }
}

let adSenseScriptInjected = false;

export function loadAdSenseScript(publisherId: string): void {
  if (adSenseScriptInjected) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
  script.crossOrigin = "anonymous";
  script.onerror = () => { script.remove(); adSenseScriptInjected = false; };
  document.head.appendChild(script);
  adSenseScriptInjected = true;
}
