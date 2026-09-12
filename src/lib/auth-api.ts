/**
 * Optional shared secret for expensive / listing endpoints.
 * When unset, create is still rate-limited; list stays disabled.
 */
export function runSecretConfigured(): boolean {
  return Boolean(process.env.ZALET_RUN_SECRET?.trim());
}

export function authorizeRunSecret(req: Request): boolean {
  const secret = process.env.ZALET_RUN_SECRET?.trim();
  if (!secret) return true;
  const header =
    req.headers.get("x-zalet-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  return header === secret;
}
