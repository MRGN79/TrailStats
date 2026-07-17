/**
 * Reads animation timing tokens from CSS custom properties so JS logic
 * (requestAnimationFrame loops, orchestration timeouts) uses the exact same
 * values as the CSS. The stylesheet is the single source of truth: this module
 * only parses, it never defines values. Adjusting a token in the CSS therefore
 * also adjusts the JS behaviour, with no code change.
 *
 * Under `prefers-reduced-motion` the tokens collapse to 0ms via the CSS media
 * query, so `readTimingMs` transparently returns the reduced values too. The
 * motion branch in JS should still rely on `prefersReducedMotion()` as the
 * primary signal (a duration of 0 and "user asked for less motion" are read
 * from the same place, but the intent check is clearer).
 */
export function readTimingMs(token: string, fallbackMs = 0): number {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") {
    return fallbackMs;
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  if (raw.endsWith("ms")) {
    const ms = parseFloat(raw);
    return Number.isFinite(ms) ? ms : fallbackMs;
  }
  if (raw.endsWith("s")) {
    const s = parseFloat(raw);
    return Number.isFinite(s) ? s * 1000 : fallbackMs;
  }
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallbackMs;
}

/** Reads a length token (e.g. `--anim-reveal-distance`) in pixels. */
export function readLengthPx(token: string, fallbackPx = 0): number {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") {
    return fallbackPx;
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : fallbackPx;
}

/** Single reduced-motion check (ADR-003 §3b): the primary signal for JS. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
