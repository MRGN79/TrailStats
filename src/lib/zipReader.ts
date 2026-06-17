import {
  BlobReader,
  TextWriter,
  Uint8ArrayReader,
  Uint8ArrayWriter,
  ZipReader,
  type Entry,
  type FileEntry,
} from "@zip.js/zip.js";

const ACTIVITIES_ENTRY    = /(^|\/)activities\.csv$/i;
const FIT_ENTRY           = /\.fit$/i;
const APPLE_HEALTH_ENTRY  = /\bexport\.xml$/i;
const POLAR_ENTRY         = /(^|\/)training-sessions\.csv$/i;

function isFileEntry(e: Entry): e is FileEntry {
  return !e.directory;
}

export async function withZipEntries<T>(
  source: File | Uint8Array,
  fn: (entries: FileEntry[]) => Promise<T>
): Promise<T> {
  let reader: ZipReader<unknown>;
  try {
    const dataReader =
      source instanceof Uint8Array
        ? new Uint8ArrayReader(source)
        : new BlobReader(source);
    reader = new ZipReader(dataReader);
  } catch {
    throw new Error("INVALID_ZIP");
  }

  try {
    const entries = await reader.getEntries();
    return await fn(entries.filter(isFileEntry));
  } catch (err) {
    if (err instanceof Error && err.message === "NO_ACTIVITIES") throw err;
    if (err instanceof Error && err.message === "EMPTY_FIT") throw err;
    throw new Error("INVALID_ZIP");
  } finally {
    await reader.close();
  }
}

export async function extractActivitiesCsv(
  file: File | Uint8Array
): Promise<string> {
  return withZipEntries(file, async (entries) => {
    const entry = entries.find((e) => ACTIVITIES_ENTRY.test(e.filename));
    if (!entry) throw new Error("NO_ACTIVITIES");
    return entry.getData(new TextWriter());
  });
}

export async function extractAppleHealthXml(
  file: File | Uint8Array
): Promise<string> {
  return withZipEntries(file, async (entries) => {
    const entry = entries.find((e) => APPLE_HEALTH_ENTRY.test(e.filename));
    if (!entry) throw new Error("NO_ACTIVITIES");
    return entry.getData(new TextWriter());
  });
}

export async function extractPolarCsv(
  file: File | Uint8Array
): Promise<string> {
  return withZipEntries(file, async (entries) => {
    const entry = entries.find((e) => POLAR_ENTRY.test(e.filename));
    if (!entry) throw new Error("NO_ACTIVITIES");
    return entry.getData(new TextWriter());
  });
}

export interface FitEntry {
  filename: string;
  bytes: Uint8Array;
}

export async function extractFitFiles(
  file: File | Uint8Array,
  onProgress?: (done: number, total: number) => void
): Promise<FitEntry[]> {
  return withZipEntries(file, async (entries) => {
    const fitEntries = entries.filter((e) => FIT_ENTRY.test(e.filename));
    if (fitEntries.length === 0) throw new Error("NO_ACTIVITIES");

    const out: FitEntry[] = [];
    for (let i = 0; i < fitEntries.length; i++) {
      const bytes = await fitEntries[i].getData(new Uint8ArrayWriter());
      out.push({ filename: fitEntries[i].filename, bytes });
      onProgress?.(i + 1, fitEntries.length);
    }
    return out;
  });
}

export type Platform = "strava" | "garmin" | "apple-health" | "polar";

export async function detectPlatform(
  file: File | Uint8Array
): Promise<Platform> {
  return withZipEntries(file, async (entries) => {
    // Priority: Strava CSV > Apple Health XML > Polar CSV > any FIT files
    if (entries.some((e) => ACTIVITIES_ENTRY.test(e.filename)))   return "strava";
    if (entries.some((e) => APPLE_HEALTH_ENTRY.test(e.filename))) return "apple-health";
    if (entries.some((e) => POLAR_ENTRY.test(e.filename)))        return "polar";
    if (entries.some((e) => FIT_ENTRY.test(e.filename)))          return "garmin";
    throw new Error("NO_ACTIVITIES");
  });
}
