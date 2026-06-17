import type { Activity, ParsedDataset } from "./types";
import { isValidHr } from "./aggregate";

const ACTIVITY_TYPE: Record<string, string> = {
  HKWorkoutActivityTypeRunning: "Run",
  HKWorkoutActivityTypeCycling: "Ride",
  HKWorkoutActivityTypeWalking: "Walk",
  HKWorkoutActivityTypeHiking: "Hike",
  HKWorkoutActivityTypeSwimming: "Swim",
  HKWorkoutActivityTypeDownhillSkiing: "AlpineSki",
  HKWorkoutActivityTypeCrossCountrySkiing: "NordicSki",
  HKWorkoutActivityTypeSnowboarding: "Snowboard",
  HKWorkoutActivityTypeSnowSports: "Snowboard",
  HKWorkoutActivityTypeRowingMachine: "Rowing",
  HKWorkoutActivityTypeRowing: "Rowing",
  HKWorkoutActivityTypeElliptical: "Elliptical",
  HKWorkoutActivityTypeStairClimbing: "StairStepper",
  HKWorkoutActivityTypeYoga: "Yoga",
  HKWorkoutActivityTypeStrengthTraining: "WeightTraining",
  HKWorkoutActivityTypeFunctionalStrengthTraining: "WeightTraining",
  HKWorkoutActivityTypeCrossTraining: "Workout",
  HKWorkoutActivityTypeHighIntensityIntervalTraining: "Workout",
  HKWorkoutActivityTypeMixedCardio: "Workout",
  HKWorkoutActivityTypePaddleSports: "Kayaking",
  HKWorkoutActivityTypeSurfingSports: "Surfing",
  HKWorkoutActivityTypeOther: "Workout",
};

function mapType(raw: string): string {
  if (ACTIVITY_TYPE[raw]) return ACTIVITY_TYPE[raw];
  // Strip prefix and title-case: HKWorkoutActivityTypeBoxing → Boxing
  const stripped = raw.replace(/^HKWorkoutActivityType/, "");
  return stripped.length ? stripped[0].toUpperCase() + stripped.slice(1) : "Workout";
}

function parseAppleDate(s: string): Date {
  // "2026-01-15 08:30:00 +0100" → replace first space with T, fix timezone offset
  const iso = s.replace(" ", "T").replace(/ ([+-])(\d{2})(\d{2})$/, "$1$2:$3");
  return new Date(iso);
}

function attr(el: Element, name: string): string {
  return el.getAttribute(name) ?? "";
}

function numAttr(el: Element, name: string): number {
  return parseFloat(el.getAttribute(name) ?? "");
}

function getStatistic(workout: Element, type: string): Element | null {
  const stats = workout.querySelectorAll("WorkoutStatistics");
  for (const s of stats) {
    if (s.getAttribute("type") === type) return s;
  }
  return null;
}

function statValue(workout: Element, type: string, attribute: string): number | null {
  const el = getStatistic(workout, type);
  if (!el) return null;
  const v = parseFloat(el.getAttribute(attribute) ?? "");
  return isNaN(v) ? null : v;
}

function toKm(value: number, unit: string): number {
  return unit === "mi" ? value * 1.60934 : value;
}

export function parseAppleHealthXml(xml: string): ParsedDataset {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const workouts = Array.from(doc.querySelectorAll("Workout"));

  const activities: Activity[] = [];
  let discarded = 0;

  workouts.forEach((w, i) => {
    const startDateStr = attr(w, "startDate");
    if (!startDateStr) { discarded++; return; }

    const date = parseAppleDate(startDateStr);
    if (isNaN(date.getTime())) { discarded++; return; }

    const distanceRaw = numAttr(w, "totalDistance");
    const distanceKm = isNaN(distanceRaw) ? 0 : toKm(distanceRaw, attr(w, "totalDistanceUnit") || "km");

    // duration is in minutes
    const durationMin = numAttr(w, "duration");
    const movingTimeSec = isNaN(durationMin) ? 0 : Math.round(durationMin * 60);

    if (movingTimeSec <= 0 && distanceKm <= 0) { discarded++; return; }

    const caloriesRaw = numAttr(w, "totalEnergyBurned");
    const caloriesUnit = attr(w, "totalEnergyBurnedUnit") || "kcal";
    const calories = isNaN(caloriesRaw) ? null
      : caloriesUnit === "kJ" ? Math.round(caloriesRaw / 4.184)
      : Math.round(caloriesRaw);

    const avgHr = statValue(w, "HKQuantityTypeIdentifierHeartRate", "average");
    const maxHr = statValue(w, "HKQuantityTypeIdentifierHeartRate", "maximum");
    const elevationM = statValue(w, "HKQuantityTypeIdentifierElevationAscended", "sum");
    const cadence = statValue(w, "HKQuantityTypeIdentifierRunningCadence", "average");
    const power = statValue(w, "HKQuantityTypeIdentifierRunningPower", "average")
      ?? statValue(w, "HKQuantityTypeIdentifierCyclingPower", "average");

    activities.push({
      id: `apple-${startDateStr}-${i}`,
      date,
      type: mapType(attr(w, "workoutActivityType")),
      distanceKm,
      movingTimeSec,
      elevationGainM: elevationM ?? 0,
      avgHrBpm: isValidHr(avgHr) ? (avgHr as number) : null,
      maxHrBpm: isValidHr(maxHr) ? (maxHr as number) : null,
      avgCadence: cadence != null && cadence >= 20 && cadence <= 250 ? cadence : null,
      calories: calories != null && calories > 0 && calories < 50000 ? calories : null,
      avgPowerW: power != null && power > 0 && power < 3000 ? Math.round(power) : null,
      activityName: null,
    });
  });

  if (activities.length === 0) throw new Error("NO_ACTIVITIES");

  const activityTypes = Array.from(new Set(activities.map((a) => a.type))).sort();
  return { activities, activityTypes, discardedRows: discarded };
}
