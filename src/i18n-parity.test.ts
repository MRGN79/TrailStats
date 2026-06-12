import { describe, expect, it } from "vitest";
import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";

type Json = Record<string, unknown>;

// Flatten nested translation objects into dot-paths so we can compare the full
// key surface of EN against ES regardless of nesting depth.
function flatten(obj: Json, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flatten(v as Json, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

describe("i18n: EN and ES translation parity", () => {
  const enKeys = flatten(en as Json);
  const esKeys = flatten(es as Json);

  it("has no keys present in EN but missing in ES", () => {
    const missing = enKeys.filter((k) => !esKeys.includes(k));
    expect(missing).toEqual([]);
  });

  it("has no keys present in ES but missing in EN", () => {
    const extra = esKeys.filter((k) => !enKeys.includes(k));
    expect(extra).toEqual([]);
  });

  it("includes the 0.8.0 persistence and a11y keys in both languages", () => {
    for (const key of [
      "upload.purge",
      "upload.purgeConfirm",
      "upload.dashboardReady",
      "a11y.skipToMain",
    ]) {
      expect(enKeys).toContain(key);
      expect(esKeys).toContain(key);
    }
  });

  it("has no empty string values in either language", () => {
    const empties: string[] = [];
    const walk = (obj: Json, prefix = "") => {
      for (const [k, v] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) walk(v as Json, path);
        else if (typeof v === "string" && v.trim() === "") empties.push(path);
      }
    };
    walk(en as Json);
    walk(es as Json);
    expect(empties).toEqual([]);
  });
});
