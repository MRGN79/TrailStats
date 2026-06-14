import { describe, expect, it } from "vitest";
import { formatPace, splitDecimal } from "./format";

describe("formatPace", () => {
  it("formats seconds per km as min:ss", () => {
    expect(formatPace(330)).toBe("5:30");
    expect(formatPace(300)).toBe("5:00");
    expect(formatPace(605)).toBe("10:05");
  });

  it("rounds to the nearest second", () => {
    expect(formatPace(330.4)).toBe("5:30");
    expect(formatPace(330.6)).toBe("5:31");
  });

  it("returns an em dash for invalid or non-positive values", () => {
    expect(formatPace(0)).toBe("—");
    expect(formatPace(-5)).toBe("—");
    expect(formatPace(NaN)).toBe("—");
    expect(formatPace(Infinity)).toBe("—");
  });
});

describe("splitDecimal", () => {
  it("splits an en-US formatted string at the decimal point", () => {
    expect(splitDecimal("6,379.2", "en")).toEqual({ integer: "6,379", decimal: ".2" });
  });

  it("splits when there are two decimal digits (en)", () => {
    expect(splitDecimal("12.34", "en")).toEqual({ integer: "12", decimal: ".34" });
  });

  it("splits an es-ES formatted string at the comma decimal separator", () => {
    expect(splitDecimal("6.379,2", "es")).toEqual({ integer: "6.379", decimal: ",2" });
  });

  it("returns the full string unchanged when there is no decimal part", () => {
    expect(splitDecimal("6,379", "en")).toEqual({ integer: "6,379", decimal: "" });
  });

  it("does not split at a thousands separator (tail has more than 2 digits)", () => {
    // "6.379" in en locale: "." is the decimal separator but "379" is 3 digits → no split
    expect(splitDecimal("6.379", "en")).toEqual({ integer: "6.379", decimal: "" });
  });
});
