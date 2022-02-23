import { log } from '@serverless/utils/log';
import fs from 'fs';
import path from 'path';

export default async function thruCache<T>(
  cachePath: string,
  isValidFn: (j: unknown) => j is T,
  refreshFn: () => Promise<unknown>,
): Promise<T> {
  try {
    const cached = fs.readFileSync(cachePath, 'utf-8');
    const json: unknown = JSON.parse(cached);
    if (isValidFn(json)) {
      log.verbose(`serverless-better-credentials: sso cache-hit ${cachePath}`);
      return json;
    }
  } catch (_) {
    // non-existent or invalid cache; refresh is expected to fix.
  }

  log.verbose(`serverless-better-credentials: sso cache-miss: ${cachePath}`);
  const refreshed = await refreshFn();
  if (!isValidFn(refreshed)) { throw new Error('Cache invalid after refresh'); }

  if (!fs.existsSync(cachePath)) fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify(refreshed), 'utf-8');
  return refreshed;
}
