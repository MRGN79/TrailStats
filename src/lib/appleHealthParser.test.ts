import { describe, expect, it } from "vitest";
import { parseAppleHealthXml } from "./appleHealthParser";

function makeXml(workouts: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
${workouts}
</HealthData>`;
}

function workout(attrs: Record<string, string>, children = ""): string {
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<Workout ${attrStr}>${children}</Workout>`;
}

function stats(type: string, attrs: Record<string, string>): string {
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<WorkoutStatistics type="${type}" ${attrStr}/>`;
}

const BASE = {
  workoutActivityType: "HKWorkoutActivityTypeRunning",
  startDate: "2026-01-15 08:30:00 +0100",
  endDate: "2026-01-15 09:05:00 +0100",
  duration: "35",
  durationUnit: "min",
  totalDistance: "10.0",
  totalDistanceUnit: "km",
  totalEnergyBurned: "500",
  totalEnergyBurnedUnit: "kcal",
};

describe("parseAppleHealthXml", () => {
  it("parses a basic running workout", () => {
    const xml = makeXml(workout(BASE));
    const ds = parseAppleHealthXml(xml);
    expect(ds.activities).toHaveLength(1);
    const a = ds.activities[0];
    expect(a.type).toBe("Run");
    expect(a.distanceKm).toBe(10);
    expect(a.movingTimeSec).toBe(35 * 60);
    expect(a.calories).toBe(500);
    expect(a.date.getFullYear()).toBe(2026);
  });

  it("converts miles to km", () => {
    const xml = makeXml(
      workout({ ...BASE, totalDistance: "6.2137", totalDistanceUnit: "mi" })
    );
    const ds = parseAppleHealthXml(xml);
    expect(ds.activities[0].distanceKm).toBeCloseTo(10.0, 1);
  });

  it("converts kJ calories to kcal", () => {
    const xml = makeXml(
      workout({ ...BASE, totalEnergyBurned: "2092", totalEnergyBurnedUnit: "kJ" })
    );
    const ds = parseAppleHealthXml(xml);
    expect(ds.activities[0].calories).toBe(Math.round(2092 / 4.184));
  });

  it("extracts HR from WorkoutStatistics", () => {
    const children =
      stats("HKQuantityTypeIdentifierHeartRate", {
        average: "145",
        maximum: "175",
        unit: "count/min",
      });
    const xml = makeXml(workout(BASE, children));
    const ds = parseAppleHealthXml(xml);
    expect(ds.activities[0].avgHrBpm).toBe(145);
    expect(ds.activities[0].maxHrBpm).toBe(175);
  });

  it("extracts elevation from WorkoutStatistics", () => {
    const children = stats("HKQuantityTypeIdentifierElevationAscended", {
      sum: "350",
      unit: "m",
    });
    const xml = makeXml(workout(BASE, children));
    const ds = parseAppleHealthXml(xml);
    expect(ds.activities[0].elevationGainM).toBe(350);
  });

  it("extracts running cadence from WorkoutStatistics", () => {
    const children = stats("HKQuantityTypeIdentifierRunningCadence", {
      average: "170",
      unit: "count/min",
    });
    const xml = makeXml(workout(BASE, children));
    const ds = parseAppleHealthXml(xml);
    expect(ds.activities[0].avgCadence).toBe(170);
  });

  it("maps known workout types", () => {
    const types: [string, string][] = [
      ["HKWorkoutActivityTypeCycling", "Ride"],
      ["HKWorkoutActivityTypeWalking", "Walk"],
      ["HKWorkoutActivityTypeHiking", "Hike"],
      ["HKWorkoutActivityTypeSwimming", "Swim"],
      ["HKWorkoutActivityTypeDownhillSkiing", "AlpineSki"],
    ];
    for (const [hkType, expected] of types) {
      const xml = makeXml(workout({ ...BASE, workoutActivityType: hkType }));
      const ds = parseAppleHealthXml(xml);
      expect(ds.activities[0].type, `${hkType} → ${expected}`).toBe(expected);
    }
  });

  it("strips prefix for unknown types", () => {
    const xml = makeXml(
      workout({ ...BASE, workoutActivityType: "HKWorkoutActivityTypeBoxing" })
    );
    const ds = parseAppleHealthXml(xml);
    expect(ds.activities[0].type).toBe("Boxing");
  });

  it("discards workouts with no time and no distance", () => {
    const valid = workout(BASE);
    const invalid = workout({ ...BASE, duration: "0", totalDistance: "0" });
    const ds = parseAppleHealthXml(makeXml(valid + "\n" + invalid));
    expect(ds.discardedRows).toBe(1);
    expect(ds.activities).toHaveLength(1);
  });

  it("throws NO_ACTIVITIES when there are no workouts at all", () => {
    expect(() => parseAppleHealthXml(makeXml(""))).toThrow("NO_ACTIVITIES");
  });

  it("returns sorted unique activityTypes", () => {
    const two = [
      workout(BASE),
      workout({ ...BASE, workoutActivityType: "HKWorkoutActivityTypeHiking" }),
    ].join("\n");
    const ds = parseAppleHealthXml(makeXml(two));
    expect(ds.activityTypes).toEqual(["Hike", "Run"]);
  });
});
