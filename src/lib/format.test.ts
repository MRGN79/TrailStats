import { describe, expect, it } from "vitest";
import { formatPace } from "./format";

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
