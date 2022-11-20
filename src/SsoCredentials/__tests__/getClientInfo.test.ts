import fs from 'fs';
import path from 'path';
import os from 'os';
import getClientInfo from '../getClientInfo';

test('it registers a client to get future credentials', async () => {
  const cacheBasePath = fs.mkdtempSync(path.join(os.tmpdir(), 'serverless-better-credentials-test-'));

  const clientInfo = {
    clientId: 'test-client-id',
    clientSecret: 'test',
    clientSecretExpiresAt: (Date.now() / 1000) + 30 * 60,
  };

  const service = {
    registerClient: jest.fn().mockReturnValueOnce({
      promise: () => Promise.resolve(clientInfo),
    }),
  } as unknown as AWS.SSOOIDC;

  const response = await getClientInfo(service, { cacheBasePath, region: 'us-east-1' });
  expect(response).toEqual(clientInfo);

  const cachedResponse = await getClientInfo(service, { cacheBasePath, region: 'us-east-1' });
  expect(cachedResponse).toEqual(clientInfo);

  expect(service.registerClient).toHaveBeenCalledTimes(1);

  fs.rmSync(cacheBasePath, { recursive: true });
});

test('it re-registers a client when the cached one expires', async () => {
  const cacheBasePath = fs.mkdtempSync(path.join(os.tmpdir(), 'serverless-better-credentials-test-'));

  const params = { cacheBasePath, region: 'us-east-1' };
  const service = {
    registerClient: jest.fn().mockReturnValueOnce({
      promise: () => Promise.resolve({
        clientId: 'test-client-id',
        clientSecret: 'service',
        clientSecretExpiresAt: (Date.now() / 1000) + 30 * 60,
      }),
    }),
  } as unknown as AWS.SSOOIDC;

  fs.writeFileSync(path.join(cacheBasePath, 'better-serverless-credentials-id-us-east-1.json'), JSON.stringify({
    clientId: 'test-client-id',
    clientSecret: 'cached',
    clientSecretExpiresAt: (Date.now() / 1000) + 30 * 60,
  }));

  const cached = await getClientInfo(service, params);
  expect(cached.clientSecret).toBe('cached');

  fs.writeFileSync(path.join(cacheBasePath, 'better-serverless-credentials-id-us-east-1.json'), JSON.stringify({
    clientId: 'test-client-id',
    clientSecret: 'expired',
    clientSecretExpiresAt: (Date.now() / 1000) - 30 * 60,
  }));

  const refreshed = await getClientInfo(service, params);
  expect(refreshed.clientSecret).toBe('service'); // not 'expired'

  fs.rmSync(cacheBasePath, { recursive: true });
});
