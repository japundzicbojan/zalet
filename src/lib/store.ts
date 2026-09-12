import { promises as fs } from "fs";
import path from "path";
import type { Run, TraceEvent } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data", "runs");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function fileFor(id: string) {
  return path.join(DATA_DIR, `${id}.json`);
}

export async function saveRun(run: Run): Promise<Run> {
  await ensureDir();
  const next = { ...run, updatedAt: Date.now() };
  await fs.writeFile(fileFor(run.id), JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function getRun(id: string): Promise<Run | null> {
  try {
    const raw = await fs.readFile(fileFor(id), "utf8");
    return JSON.parse(raw) as Run;
  } catch {
    return null;
  }
}

export async function listRuns(): Promise<Run[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const runs: Run[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(DATA_DIR, f), "utf8");
      runs.push(JSON.parse(raw) as Run);
    } catch {
      /* skip corrupt */
    }
  }
  return runs.sort((a, b) => b.createdAt - a.createdAt);
}

export async function appendEvent(
  id: string,
  event: TraceEvent,
): Promise<Run | null> {
  const run = await getRun(id);
  if (!run) return null;
  return saveRun({ ...run, events: [...run.events, event] });
}

export async function patchRun(
  id: string,
  patch: Partial<Run>,
): Promise<Run | null> {
  const run = await getRun(id);
  if (!run) return null;
  return saveRun({ ...run, ...patch, id: run.id, createdAt: run.createdAt });
}
