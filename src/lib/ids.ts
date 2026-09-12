const RUN_ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

/** Reject path traversal / odd ids before touching the filesystem. */
export function assertSafeRunId(id: string): string {
  if (!RUN_ID_RE.test(id)) {
    throw new Error("Invalid run id");
  }
  return id;
}

export function isSafeRunId(id: string): boolean {
  return RUN_ID_RE.test(id);
}
