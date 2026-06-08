import type { ParsedDataset } from "./types";

interface SerializableDataset {
  activities: Array<{
    id: string;
    date: string;
    type: string;
    distanceKm: number;
    movingTimeSec: number;
    elevationGainM: number;
  }>;
  activityTypes: string[];
  discardedRows: number;
}

type WorkerResponse =
  | { ok: true; data: SerializableDataset }
  | { ok: false; error: string };

export function processFile(file: File): Promise<ParsedDataset> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./processor.worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      worker.terminate();
      if (e.data.ok) {
        resolve({
          activities: e.data.data.activities.map((a) => ({
            ...a,
            date: new Date(a.date),
          })),
          activityTypes: e.data.data.activityTypes,
          discardedRows: e.data.data.discardedRows,
        });
      } else {
        reject(new Error(e.data.error));
      }
    };

    worker.onerror = () => {
      worker.terminate();
      reject(new Error("INVALID_ZIP"));
    };

    worker.postMessage({ file });
  });
}
