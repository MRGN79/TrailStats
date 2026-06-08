/// <reference lib="webworker" />
import { extractActivitiesCsv } from "./zipReader";
import { parseActivitiesCsv } from "./stravaParser";
import type { ParsedDataset } from "./types";

interface WorkerRequest {
  file: File;
}

type WorkerResponse =
  | { ok: true; data: SerializableDataset }
  | { ok: false; error: string };

interface SerializableDataset {
  activities: Array<Omit<ParsedDataset["activities"][number], "date"> & { date: string }>;
  activityTypes: string[];
  discardedRows: number;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  try {
    const csv = await extractActivitiesCsv(e.data.file);
    const dataset = parseActivitiesCsv(csv);
    const serializable: SerializableDataset = {
      activities: dataset.activities.map((a) => ({
        ...a,
        date: a.date.toISOString(),
      })),
      activityTypes: dataset.activityTypes,
      discardedRows: dataset.discardedRows,
    };
    const res: WorkerResponse = { ok: true, data: serializable };
    self.postMessage(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "INVALID_ZIP";
    const res: WorkerResponse = { ok: false, error: message };
    self.postMessage(res);
  }
};
