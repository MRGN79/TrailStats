import type { ParsedDataset } from "./types";
import {
  detectPlatform,
  extractActivitiesCsv,
  extractAppleHealthXml,
  extractFitFiles,
  extractPolarCsv,
  type Platform,
} from "./zipReader";
import { parseActivitiesCsv } from "./stravaParser";
import { parseFitFiles } from "./garminParser";
import { parseAppleHealthXml } from "./appleHealthParser";
import { parsePolarCsv } from "./polarParser";

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
  "apple-health": {
    platform: "apple-health",
    async parse(file) {
      const xml = await extractAppleHealthXml(file);
      return parseAppleHealthXml(xml);
    },
  },
  polar: {
    platform: "polar",
    async parse(file) {
      const csv = await extractPolarCsv(file);
      return parsePolarCsv(csv);
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
