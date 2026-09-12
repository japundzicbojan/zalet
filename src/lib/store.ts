import { promises as fs } from "fs";
import path from "path";
import { assertSafeRunId, isSafeRunId } from "./ids";
import type { Run, TraceEvent } from "./types";
import { syncRunToConvex } from "./convex-sync";

function dataRoot() {
  return process.env.ZALET_DATA_DIR?.trim() || path.join(process.cwd(), ".data");
}

function runsDir() {
  return path.join(dataRoot(), "runs");
}

function packsDir() {
  return path.join(dataRoot(), "packs");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function fileFor(id: string) {
  const safe = assertSafeRunId(id);
  const file = path.join(runsDir(), `${safe}.json`);
  const root = path.resolve(runsDir());
  if (!path.resolve(file).startsWith(root + path.sep)) {
    throw new Error("Invalid run id");
  }
  return file;
}

export function packDirFor(id: string) {
  const safe = assertSafeRunId(id);
  const dir = path.join(packsDir(), safe);
  const root = path.resolve(packsDir());
  if (!path.resolve(dir).startsWith(root + path.sep)) {
    throw new Error("Invalid run id");
  }
  return dir;
}

export async function savePackZip(id: string, bytes: Buffer): Promise<string> {
  const dir = packDirFor(id);
  await ensureDir(dir);
  const zipPath = path.join(dir, "campaign.zip");
  await fs.writeFile(zipPath, bytes);
  return zipPath;
}

export async function savePackPreviewHtml(
  id: string,
  html: string,
): Promise<string> {
  const dir = packDirFor(id);
  await ensureDir(dir);
  const htmlPath = path.join(dir, "index.html");
  await fs.writeFile(htmlPath, html, "utf8");
  return htmlPath;
}

export async function getPackZipPath(id: string): Promise<string | null> {
  if (!isSafeRunId(id)) return null;
  const zipPath = path.join(packDirFor(id), "campaign.zip");
  try {
    await fs.access(zipPath);
    return zipPath;
  } catch {
    return null;
  }
}

export async function getPackPreviewHtml(id: string): Promise<string | null> {
  if (!isSafeRunId(id)) return null;
  try {
    return await fs.readFile(path.join(packDirFor(id), "index.html"), "utf8");
  } catch {
    return null;
  }
}

export async function saveRun(run: Run): Promise<Run> {
  await ensureDir(runsDir());
  const next = { ...run, updatedAt: Date.now() };
  await fs.writeFile(fileFor(run.id), JSON.stringify(next, null, 2), "utf8");
  void syncRunToConvex(next).catch(() => {
    /* Convex optional */
  });
  return next;
}

export async function getRun(id: string): Promise<Run | null> {
  if (!isSafeRunId(id)) return null;
  try {
    const raw = await fs.readFile(fileFor(id), "utf8");
    return JSON.parse(raw) as Run;
  } catch {
    return null;
  }
}

export async function listRuns(): Promise<Run[]> {
  await ensureDir(runsDir());
  const files = await fs.readdir(runsDir());
  const runs: Run[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const id = f.slice(0, -".json".length);
    if (!isSafeRunId(id)) continue;
    try {
      const raw = await fs.readFile(path.join(runsDir(), f), "utf8");
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
