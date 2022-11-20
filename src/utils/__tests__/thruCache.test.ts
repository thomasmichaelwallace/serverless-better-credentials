import fs from 'fs';
import path from 'path';
import os from 'os';
import thruCache from '../thruCache';

test('gets, caches and invalidates a response', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'serverless-better-credentials-test-'));
  const cachePath = path.join(dir, 'cache.json');

  let isValid = true;
  const isValidFn = (j: unknown): j is string => j !== undefined && isValid;
  let nextValue = 'initial';
  const refreshFn = () => {
    isValid = true; // generated values are all valid.
    return Promise.resolve(nextValue);
  };

  const first = await thruCache<string>(cachePath, isValidFn, refreshFn);
  expect(first).toBe('initial');
  nextValue = 'updated';
  const second = await thruCache<string>(cachePath, isValidFn, refreshFn);
  expect(second).toBe('initial');
  isValid = false;
  const third = await thruCache<string>(cachePath, isValidFn, refreshFn);
  expect(third).toBe('updated');

  fs.rmSync(dir, { recursive: true });
});
