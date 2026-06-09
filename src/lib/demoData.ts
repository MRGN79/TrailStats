import type { Activity, ParsedDataset } from "./types";

// Deterministic seeded generator (mulberry32). A fixed seed makes the demo
// dataset reproducible across loads and testable, while the date window is
// anchored to "now" so the 18-month history is always current.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface TypeProfile {
  type: string;
  weight: number;
  distanceKm: [number, number];
  paceSecPerKm: [number, number];
  elevationPerKm: [number, number];
}

const PROFILES: TypeProfile[] = [
  { type: "Run", weight: 0.34, distanceKm: [6, 14], paceSecPerKm: [300, 360], elevationPerKm: [4, 12] },
  { type: "Trail Run", weight: 0.18, distanceKm: [8, 22], paceSecPerKm: [330, 430], elevationPerKm: [25, 55] },
  { type: "Ride", weight: 0.28, distanceKm: [25, 85], paceSecPerKm: [110, 150], elevationPerKm: [8, 18] },
  { type: "Hike", weight: 0.12, distanceKm: [7, 18], paceSecPerKm: [600, 800], elevationPerKm: [40, 80] },
  { type: "Walk", weight: 0.08, distanceKm: [3, 7], paceSecPerKm: [650, 780], elevationPerKm: [2, 8] },
];

const SEED = 0x5ea50a7;

function lerp(rng: () => number, [min, max]: [number, number]): number {
  return min + rng() * (max - min);
}

// More volume in spring/summer, less in deep winter. month is 0-11.
function seasonalFactor(month: number): number {
  // Peak around June (5), trough around December/January.
  const phase = Math.cos(((month - 5) / 12) * 2 * Math.PI);
  return 0.6 + 0.4 * ((phase + 1) / 2) + 0.4 * (month >= 3 && month <= 8 ? 1 : 0);
}

function pickType(rng: () => number): TypeProfile {
  const r = rng();
  let acc = 0;
  for (const p of PROFILES) {
    acc += p.weight;
    if (r <= acc) return p;
  }
  return PROFILES[0];
}

export function generateDemoDataset(now: Date = new Date()): ParsedDataset {
  const rng = mulberry32(SEED);
  const activities: Activity[] = [];

  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setMonth(start.getMonth() - 18);

  // Walk week by week from start to end.
  const cursor = new Date(start);
  let counter = 0;
  while (cursor <= end) {
    const factor = seasonalFactor(cursor.getMonth());
    // 2 to 6 activities per week scaled by season.
    const target = Math.round(lerp(rng, [2, 4]) + factor * 1.6);
    for (let i = 0; i < target; i++) {
      const dayOffset = Math.floor(rng() * 7);
      const date = new Date(cursor);
      date.setDate(date.getDate() + dayOffset);
      if (date > end) continue;

      const profile = pickType(rng);
      const distanceKm = Number((lerp(rng, profile.distanceKm) * (0.85 + factor * 0.2)).toFixed(2));
      const pace = lerp(rng, profile.paceSecPerKm);
      const movingTimeSec = Math.round(distanceKm * pace);
      const elevationGainM = Math.round(distanceKm * lerp(rng, profile.elevationPerKm));

      activities.push({
        id: `demo-${counter++}`,
        date,
        type: profile.type,
        distanceKm,
        movingTimeSec,
        elevationGainM,
      });
    }
    cursor.setDate(cursor.getDate() + 7);
  }

  activities.sort((a, b) => a.date.getTime() - b.date.getTime());

  const activityTypes = Array.from(new Set(activities.map((a) => a.type))).sort();

  return {
    activities,
    activityTypes,
    discardedRows: 0,
  };
}
