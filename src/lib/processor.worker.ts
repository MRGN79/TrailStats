/// <reference lib="webworker" />
import { parseExport } from "./parserRegistry";
import type { Platform } from "./zipReader";
import type { ParsedDataset } from "./types";

interface WorkerRequest {
  file: File;
}

interface SerializableDataset {
  activities: Array<
    Omit<ParsedDataset["activities"][number], "date"> & { date: string }
  >;
  activityTypes: string[];
  discardedRows: number;
}

type WorkerResponse =
  | { ok: true; platform: Platform; data: SerializableDataset }
  | { ok: false; error: string }
  | { ok: "progress"; done: number; total: number };

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  try {
    const { platform, dataset } = await parseExport(e.data.file, (p) => {
      const msg: WorkerResponse = {
        ok: "progress",
        done: p.done,
        total: p.total,
      };
      self.postMessage(msg);
    });

    const serializable: SerializableDataset = {
      activities: dataset.activities.map((a) => ({
        ...a,
        date: a.date.toISOString(),
      })),
      activityTypes: dataset.activityTypes,
      discardedRows: dataset.discardedRows,
    };
    const res: WorkerResponse = { ok: true, platform, data: serializable };
    self.postMessage(res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "INVALID_ZIP";
    const res: WorkerResponse = { ok: false, error: message };
    self.postMessage(res);
  }
};
