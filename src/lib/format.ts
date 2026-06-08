export function formatDistance(km: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(km);
}

export function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(Math.round(n));
}

export function formatDuration(seconds: number, locale: string): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const h = new Intl.NumberFormat(locale).format(hours);
  const m = String(minutes).padStart(2, "0");
  return `${h}h ${m}m`;
}
