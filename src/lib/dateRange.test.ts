import { describe, expect, it } from "vitest";
import { presetToRange } from "./dateRange";

const TODAY = new Date(2024, 5, 15); // 15 Jun 2024

describe("presetToRange", () => {
  it("all → null/null", () => {
    const { from, to } = presetToRange("all", TODAY);
    expect(from).toBeNull();
    expect(to).toBeNull();
  });

  it("thisYear → Jan 1 of current year, to null", () => {
    const { from, to } = presetToRange("thisYear", TODAY);
    expect(from).toEqual(new Date(2024, 0, 1));
    expect(to).toBeNull();
  });

  it("lastYear → Jan 1 to Dec 31 of previous year", () => {
    const { from, to } = presetToRange("lastYear", TODAY);
    expect(from).toEqual(new Date(2023, 0, 1));
    expect(to).toEqual(new Date(2023, 11, 31));
  });

  it("last6m → 6 months before today, to null", () => {
    const { from, to } = presetToRange("last6m", TODAY);
    expect(from).toEqual(new Date(2023, 11, 15)); // Dec 15 2023
    expect(to).toBeNull();
  });

  it("last3m → 3 months before today, to null", () => {
    const { from, to } = presetToRange("last3m", TODAY);
    expect(from).toEqual(new Date(2024, 2, 15)); // Mar 15 2024
    expect(to).toBeNull();
  });

  it("custom → null/null (user sets manually)", () => {
    const { from, to } = presetToRange("custom", TODAY);
    expect(from).toBeNull();
    expect(to).toBeNull();
  });
});
