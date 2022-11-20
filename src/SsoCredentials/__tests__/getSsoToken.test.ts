import fs from 'fs';
import path from 'path';
import os from 'os';
import getSsoToken from '../getSsoToken';
import getFreshSsoToken from '../getFreshSsoToken';

jest.mock('../getClientInfo');
jest.mock('../getFreshSsoToken');
jest.mock('crypto', () => ({
  createHash: () => ({
    update: (s: string) => ({
      digest: (e: string) => `hashed_${s}_${e}`,
    }),
  }),
}));

test('it gets and caches an sso token', async () => {
  const startUrl = 'https://testing.awsapps.com/start';

  const cacheBasePath = fs.mkdtempSync(path.join(os.tmpdir(), 'serverless-better-credentials-test-'));
  const cachePath = path.join(cacheBasePath, 'hashed_https://testing.awsapps.com/start_hex.json');

  const service = 'SERVICE' as unknown as AWS.SSOOIDC;
  const params = {
    region: 'eu-west-1',
    startUrl,
    cacheBasePath,
  };

  m(getFreshSsoToken).mockResolvedValueOnce({
    startUrl,
    region: 'eu-west-1',
    accessToken: 'TOKEN',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  });

  const token = await getSsoToken(service, params);
  expect(token).toBeDefined();
  const cache = await getSsoToken(service, params);
  expect(getFreshSsoToken).toHaveBeenCalledTimes(1);
  expect(cache).toEqual(token);

  const cacheFile = JSON.parse(fs.readFileSync(cachePath, 'utf8')) as typeof token;
  expect(cacheFile).toEqual(token);

  fs.rmSync(cacheBasePath, { recursive: true });
});
