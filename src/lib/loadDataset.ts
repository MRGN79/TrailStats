import type { ParsedDataset } from "./types";
import type { Platform } from "./zipReader";

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
  | { ok: true; platform: Platform; data: SerializableDataset }
  | { ok: false; error: string }
  | { ok: "progress"; done: number; total: number };

export interface LoadResult extends ParsedDataset {
  platform: Platform;
}

export interface LoadProgress {
  done: number;
  total: number;
}

export function processFile(
  file: File,
  onProgress?: (progress: LoadProgress) => void
): Promise<LoadResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./processor.worker.ts", import.meta.url),
      { type: "module" }
    );

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.ok === "progress") {
        onProgress?.({ done: msg.done, total: msg.total });
        return;
      }

      worker.terminate();
      if (msg.ok) {
        resolve({
          platform: msg.platform,
          activities: msg.data.activities.map((a) => ({
            ...a,
            date: new Date(a.date),
          })),
          activityTypes: msg.data.activityTypes,
          discardedRows: msg.data.discardedRows,
        });
      } else {
        reject(new Error(msg.error));
      }
    };

    worker.onerror = () => {
      worker.terminate();
      reject(new Error("INVALID_ZIP"));
    };

    worker.postMessage({ file });
  });
}
