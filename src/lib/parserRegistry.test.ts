import { describe, expect, it } from "vitest";
import { Uint8ArrayReader, Uint8ArrayWriter, ZipWriter } from "@zip.js/zip.js";
import { detectPlatform } from "./zipReader";

// jsdom's Blob lacks arrayBuffer(), which zip.js's BlobReader needs. We build
// and read ZIPs entirely through Uint8Array streams (the parser accepts bytes).
async function makeZip(
  files: Array<{ name: string; text?: string; bytes?: Uint8Array }>
): Promise<Uint8Array> {
  const writer = new ZipWriter(new Uint8ArrayWriter());
  for (const f of files) {
    const bytes = f.bytes ?? new TextEncoder().encode(f.text ?? "");
    await writer.add(f.name, new Uint8ArrayReader(bytes));
  }
  return writer.close();
}

describe("detectPlatform", () => {
  it("detects a Strava export by activities.csv", async () => {
    const zip = await makeZip([
      { name: "activities.csv", text: "Activity Date\n2026-01-01" },
      { name: "media/photo.jpg", bytes: new Uint8Array([1, 2, 3]) },
    ]);
    expect(await detectPlatform(zip)).toBe("strava");
  });

  it("detects a Garmin export by .fit files", async () => {
    const zip = await makeZip([
      { name: "12345_ACTIVITY.fit", bytes: new Uint8Array([0x0e, 0x10]) },
      { name: "67890_ACTIVITY.fit", bytes: new Uint8Array([0x0e, 0x10]) },
    ]);
    expect(await detectPlatform(zip)).toBe("garmin");
  });

  it("prefers Strava when both markers are present", async () => {
    const zip = await makeZip([
      { name: "activities.csv", text: "Activity Date\n2026-01-01" },
      { name: "extra.fit", bytes: new Uint8Array([0x0e]) },
    ]);
    expect(await detectPlatform(zip)).toBe("strava");
  });

  it("detects an Apple Health export by export.xml", async () => {
    const zip = await makeZip([
      { name: "apple_health_export/export.xml", text: "<HealthData/>" },
      { name: "apple_health_export/export_cda.xml", text: "" },
    ]);
    expect(await detectPlatform(zip)).toBe("apple-health");
  });

  it("detects a Polar export by training-sessions.csv", async () => {
    const zip = await makeZip([
      { name: "training-sessions.csv", text: "Date,Sport,Duration\n2026-01-01,RUNNING,0:35:00" },
    ]);
    expect(await detectPlatform(zip)).toBe("polar");
  });

  it("prefers Apple Health over Polar when both markers are present", async () => {
    const zip = await makeZip([
      { name: "export.xml", text: "<HealthData/>" },
      { name: "training-sessions.csv", text: "Date,Sport,Duration\n2026-01-01,RUNNING,0:35:00" },
    ]);
    expect(await detectPlatform(zip)).toBe("apple-health");
  });

  it("prefers Apple Health over Garmin FIT", async () => {
    const zip = await makeZip([
      { name: "export.xml", text: "<HealthData/>" },
      { name: "activity.fit", bytes: new Uint8Array([0x0e]) },
    ]);
    expect(await detectPlatform(zip)).toBe("apple-health");
  });

  it("prefers Polar over Garmin FIT", async () => {
    const zip = await makeZip([
      { name: "training-sessions.csv", text: "Date,Sport,Duration\n2026-01-01,RUNNING,0:35:00" },
      { name: "activity.fit", bytes: new Uint8Array([0x0e]) },
    ]);
    expect(await detectPlatform(zip)).toBe("polar");
  });

  it("throws NO_ACTIVITIES for an unrecognized ZIP", async () => {
    const zip = await makeZip([{ name: "readme.txt", text: "hello" }]);
    await expect(detectPlatform(zip)).rejects.toThrow("NO_ACTIVITIES");
  });
});
