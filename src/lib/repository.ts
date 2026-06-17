import type { ParsedDataset } from "./types";

export interface ActivityRepository {
  load(): Promise<ParsedDataset | null>;
  save(dataset: ParsedDataset): Promise<void>;
  clear(): Promise<void>;
}

const DB_NAME = "trailstats";
const DB_VERSION = 1;
const STORE_NAME = "dataset";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

class IndexedDBRepository implements ActivityRepository {
  async load(): Promise<ParsedDataset | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get("current");
      req.onsuccess = () => { db.close(); resolve((req.result as ParsedDataset) ?? null); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  }

  async save(dataset: ParsedDataset): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(dataset, "current");
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async clear(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }
}

export const repository: ActivityRepository = new IndexedDBRepository();
