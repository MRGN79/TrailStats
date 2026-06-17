const LANG_KEY = "trailstats.lang";
const BANNER_DISMISSED_KEY = "trailstats.bannerDismissed";

export function saveLang(lang: string): void {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* non-fatal */ }
}

export function loadLang(): string | null {
  try { return localStorage.getItem(LANG_KEY); } catch { return null; }
}

export function saveBannerDismissed(): void {
  try { localStorage.setItem(BANNER_DISMISSED_KEY, "1"); } catch { /* non-fatal */ }
}

export function loadBannerDismissed(): boolean {
  try { return localStorage.getItem(BANNER_DISMISSED_KEY) === "1"; } catch { return false; }
}

export function clearBannerDismissed(): void {
  try { localStorage.removeItem(BANNER_DISMISSED_KEY); } catch { /* non-fatal */ }
}
