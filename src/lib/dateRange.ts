export type DatePreset =
  | "all"
  | "thisYear"
  | "lastYear"
  | "last6m"
  | "last3m"
  | "custom";

export interface DateRangeState {
  preset: DatePreset;
  from: Date | null;
  to: Date | null;
}

export const initialDateRange: DateRangeState = {
  preset: "all",
  from: null,
  to: null,
};

function subMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

export function presetToRange(
  preset: DatePreset,
  today: Date
): { from: Date | null; to: Date | null } {
  const year = today.getFullYear();
  switch (preset) {
    case "thisYear":
      return { from: new Date(year, 0, 1), to: null };
    case "lastYear":
      return { from: new Date(year - 1, 0, 1), to: new Date(year - 1, 11, 31) };
    case "last6m":
      return { from: subMonths(today, 6), to: null };
    case "last3m":
      return { from: subMonths(today, 3), to: null };
    case "all":
    case "custom":
    default:
      return { from: null, to: null };
  }
}
