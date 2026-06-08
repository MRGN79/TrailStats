import {
  BlobReader,
  TextWriter,
  ZipReader,
  type Entry,
  type FileEntry,
} from "@zip.js/zip.js";

const ACTIVITIES_ENTRY = /(^|\/)activities\.csv$/i;

export async function extractActivitiesCsv(file: File): Promise<string> {
  let reader: ZipReader<unknown>;
  try {
    reader = new ZipReader(new BlobReader(file));
  } catch {
    throw new Error("INVALID_ZIP");
  }

  try {
    const entries = await reader.getEntries();
    const isActivitiesFile = (e: Entry): e is FileEntry =>
      !e.directory && ACTIVITIES_ENTRY.test(e.filename);
    const entry = entries.find(isActivitiesFile);
    if (!entry) {
      throw new Error("NO_ACTIVITIES");
    }
    return await entry.getData(new TextWriter());
  } catch (err) {
    if (err instanceof Error && err.message === "NO_ACTIVITIES") throw err;
    throw new Error("INVALID_ZIP");
  } finally {
    await reader.close();
  }
}
