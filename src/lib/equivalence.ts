/**
 * Human-scale equivalences for the Summit hero figures (Phase 1).
 *
 * Pure and isolated (ADR-003 §5): takes primitive totals (km, m, sec) and
 * returns `{ key, count }` or `null`. It never touches the aggregation layer,
 * so Phase 2 ("year in numbers") can reuse it verbatim.
 *
 * The `key` maps to an i18n namespace `stats.equivalence.<key>` with `_one`/
 * `_other` pluralisation driven by `count`. Only meaningful equivalences are
 * returned: an equivalence whose legible-rounded value is below 1 yields `null`
 * (CE-5 — no "0.02 laps around the Earth", no filler for zero values).
 */

// Reference constants confirmed by the Arquitecto (ADR-003).
export const MARATHON_KM = 42.195;
export const EARTH_LAP_KM = 40075;
export const EVEREST_M = 8849;
export const DAY_SEC = 86400;

export type EquivalenceKey =
  | "marathons"
  | "earthLaps"
  | "everests"
  | "daysMoving";

export interface Equivalence {
  key: EquivalenceKey;
  /** Legible-rounded magnitude; also feeds i18next pluralisation. */
  count: number;
}

/**
 * Legible rounding: whole number for large magnitudes, one decimal only when
 * it adds information for small ones. Keeps the copy tidy ("34 marathons",
 * "2.3 Everests") and avoids ridiculous precision.
 */
export function roundLegible(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value >= 10) return Math.round(value);
  return Math.round(value * 10) / 10;
}

function build(key: EquivalenceKey, ratio: number): Equivalence | null {
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  const count = roundLegible(ratio);
  // Threshold (CE-5): show only when the legible value is at least 1.
  if (count < 1) return null;
  return { key, count };
}

/**
 * Distance equivalence. Prefers "laps around the Earth" once the distance is
 * at least a full lap; otherwise falls back to marathons. A single, most
 * significant equivalence per figure (US-6).
 */
export function equivalenceForDistance(km: number): Equivalence | null {
  if (!Number.isFinite(km) || km <= 0) return null;
  if (km >= EARTH_LAP_KM) {
    const laps = build("earthLaps", km / EARTH_LAP_KM);
    if (laps) return laps;
  }
  return build("marathons", km / MARATHON_KM);
}

/** Elevation gain equivalence: ascents of Everest. */
export function equivalenceForElevation(meters: number): Equivalence | null {
  return build("everests", meters / EVEREST_M);
}

/** Moving-time equivalence: full days in motion. */
export function equivalenceForMovingTime(seconds: number): Equivalence | null {
  return build("daysMoving", seconds / DAY_SEC);
}
