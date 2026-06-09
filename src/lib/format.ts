export function formatDistance(km: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(km);
}

export function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(Math.round(n));
}

/**
 * Splits a locale-formatted number string into its integer and decimal parts.
 * Detects the locale's decimal separator via formatToParts and only splits
 * when 1–2 digits follow it (to avoid confusing thousands separators with decimals).
 * Returns { integer: "6379", decimal: ",2" } for "6379,2" in es-ES.
 */
export function splitDecimal(
  formatted: string,
  locale: string
): { integer: string; decimal: string } {
  const decimalSep =
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find((p) => p.type === "decimal")?.value ?? ".";

  const lastIdx = formatted.lastIndexOf(decimalSep);
  const tail = lastIdx !== -1 ? formatted.slice(lastIdx + 1) : "";
  if (lastIdx !== -1 && /^\d{1,2}$/.test(tail)) {
    return {
      integer: formatted.slice(0, lastIdx),
      decimal: formatted.slice(lastIdx),
    };
  }
  return { integer: formatted, decimal: "" };
}

export function formatPace(secPerKm: number): string {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return "—";
  const total = Math.round(secPerKm);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatRaceTime(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function formatDuration(seconds: number, locale: string): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const h = new Intl.NumberFormat(locale).format(hours);
  const m = String(minutes).padStart(2, "0");
  return `${h}h ${m}m`;
}
