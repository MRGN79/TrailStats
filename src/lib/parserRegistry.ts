import type { ParsedDataset } from "./types";
import {
  detectPlatform,
  extractActivitiesCsv,
  extractFitFiles,
  type Platform,
} from "./zipReader";
import { parseActivitiesCsv } from "./stravaParser";
import { parseFitFiles } from "./garminParser";

export interface ParseProgress {
  done: number;
  total: number;
}

export type ExportSource = File | Uint8Array;

export interface PlatformParser {
  platform: Platform;
  parse(
    file: ExportSource,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<ParsedDataset>;
}

const PARSERS: Record<Platform, PlatformParser> = {
  strava: {
    platform: "strava",
    async parse(file) {
      const csv = await extractActivitiesCsv(file);
      return parseActivitiesCsv(csv);
    },
  },
  garmin: {
    platform: "garmin",
    async parse(file, onProgress) {
      const entries = await extractFitFiles(file, (done, total) =>
        onProgress?.({ done, total })
      );
      return parseFitFiles(entries);
    },
  },
};

export async function parseExport(
  file: ExportSource,
  onProgress?: (progress: ParseProgress) => void
): Promise<{ platform: Platform; dataset: ParsedDataset }> {
  const platform = await detectPlatform(file);
  const dataset = await PARSERS[platform].parse(file, onProgress);
  return { platform, dataset };
}
