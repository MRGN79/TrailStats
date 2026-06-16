import { describe, expect, it } from "vitest";
import { parsePolarCsv } from "./polarParser";

const HEADER =
  "Date,Sport,Duration,Total distance (km),Average heart rate (bpm),Maximum heart rate (bpm),Calories,Ascent (m),Notes";

function row(fields: string[]): string {
  return fields.join(",");
}

describe("parsePolarCsv", () => {
  it("parses a basic running row", () => {
    const csv = [
      HEADER,
      row(["2026-01-15", "RUNNING", "0:35:24", "10.5", "145", "175", "480", "120", "Morning run"]),
    ].join("\n");
    const ds = parsePolarCsv(csv);
    expect(ds.activities).toHaveLength(1);
    const a = ds.activities[0];
    expect(a.type).toBe("Run");
    expect(a.distanceKm).toBe(10.5);
    expect(a.movingTimeSec).toBe(35 * 60 + 24);
    expect(a.avgHrBpm).toBe(145);
    expect(a.maxHrBpm).toBe(175);
    expect(a.calories).toBe(480);
    expect(a.elevationGainM).toBe(120);
    expect(a.activityName).toBe("Morning run");
  });

  it("parses DD.MM.YYYY date format", () => {
    const csv = [
      HEADER,
      row(["15.01.2026", "RUNNING", "0:35:24", "10.0", "", "", "", "", ""]),
    ].join("\n");
    const ds = parsePolarCsv(csv);
    expect(ds.activities[0].date.getFullYear()).toBe(2026);
    expect(ds.activities[0].date.getMonth()).toBe(0); // January
    expect(ds.activities[0].date.getDate()).toBe(15);
  });

  it("parses MM/DD/YYYY date format", () => {
    const csv = [
      HEADER,
      row(["01/15/2026", "RUNNING", "1:00:00", "15.0", "", "", "", "", ""]),
    ].join("\n");
    const ds = parsePolarCsv(csv);
    expect(ds.activities[0].date.getMonth()).toBe(0);
    expect(ds.activities[0].date.getDate()).toBe(15);
  });

  it("maps sport types correctly", () => {
    const sports: [string, string][] = [
      ["CYCLING", "Ride"],
      ["MOUNTAIN_BIKING", "MountainBikeRide"],
      ["INDOOR_CYCLING", "VirtualRide"],
      ["WALKING", "Walk"],
      ["HIKING", "Hike"],
      ["SWIMMING", "Swim"],
    ];
    for (const [polar, expected] of sports) {
      const csv = [
        HEADER,
        row(["2026-01-15", polar, "1:00:00", "10.0", "", "", "", "", ""]),
      ].join("\n");
      const ds = parsePolarCsv(csv);
      expect(ds.activities[0].type, `${polar} → ${expected}`).toBe(expected);
    }
  });

  it("parses HH:MM:SS duration", () => {
    const csv = [
      HEADER,
      row(["2026-01-15", "RUNNING", "1:05:30", "20.0", "", "", "", "", ""]),
    ].join("\n");
    const ds = parsePolarCsv(csv);
    expect(ds.activities[0].movingTimeSec).toBe(3600 + 5 * 60 + 30);
  });

  it("parses MM:SS duration", () => {
    const csv = [
      HEADER,
      row(["2026-01-15", "RUNNING", "35:24", "10.0", "", "", "", "", ""]),
    ].join("\n");
    const ds = parsePolarCsv(csv);
    expect(ds.activities[0].movingTimeSec).toBe(35 * 60 + 24);
  });

  it("accepts alternate column names for distance in meters", () => {
    const altHeader =
      "Date,Sport,Duration,Total distance (m),Average heart rate (bpm),Maximum heart rate (bpm),Calories,Ascent (m),Notes";
    const csv = [
      altHeader,
      row(["2026-01-15", "RUNNING", "0:35:00", "10000", "", "", "", "", ""]),
    ].join("\n");
    const ds = parsePolarCsv(csv);
    expect(ds.activities[0].distanceKm).toBe(10);
  });

  it("discards rows with no time and no distance", () => {
    const csv = [
      HEADER,
      row(["2026-01-15", "RUNNING", "0:35:00", "10.0", "", "", "", "", ""]),
      row(["2026-01-16", "RUNNING", "0:00:00", "0", "", "", "", "", ""]),
    ].join("\n");
    const ds = parsePolarCsv(csv);
    expect(ds.discardedRows).toBe(1);
    expect(ds.activities).toHaveLength(1);
  });

  it("discards rows with empty date", () => {
    const csv = [
      HEADER,
      row(["2026-01-15", "RUNNING", "0:35:00", "10.0", "", "", "", "", ""]),
      row(["", "RUNNING", "0:35:00", "10.0", "", "", "", "", ""]),
    ].join("\n");
    const ds = parsePolarCsv(csv);
    expect(ds.discardedRows).toBe(1);
    expect(ds.activities).toHaveLength(1);
  });

  it("throws NO_ACTIVITIES when there are no data rows", () => {
    expect(() => parsePolarCsv(HEADER)).toThrow("NO_ACTIVITIES");
  });

  it("throws NO_ACTIVITIES when required columns are missing", () => {
    expect(() => parsePolarCsv("Sport,Duration\nRUNNING,1:00:00")).toThrow(
      "NO_ACTIVITIES"
    );
  });

  it("returns sorted unique activityTypes", () => {
    const csv = [
      HEADER,
      row(["2026-01-15", "RUNNING", "0:35:00", "10.0", "", "", "", "", ""]),
      row(["2026-01-16", "CYCLING", "1:00:00", "30.0", "", "", "", "", ""]),
    ].join("\n");
    const ds = parsePolarCsv(csv);
    expect(ds.activityTypes).toEqual(["Ride", "Run"]);
  });

  it("rejects out-of-range HR values", () => {
    const csv = [
      HEADER,
      row(["2026-01-15", "RUNNING", "0:35:00", "10.0", "25", "300", "", "", ""]),
    ].join("\n");
    const ds = parsePolarCsv(csv);
    expect(ds.activities[0].avgHrBpm).toBeNull();
    expect(ds.activities[0].maxHrBpm).toBeNull();
  });
});
