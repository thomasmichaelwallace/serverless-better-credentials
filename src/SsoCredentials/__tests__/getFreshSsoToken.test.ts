import { log } from '@serverless/utils/log';
import open from 'open';
import { ClientInfo } from '../../types';
import getFreshSsoToken from '../getFreshSsoToken';

jest.mock('open');
jest.mock('@serverless/utils/log', () => ({
  log: {
    notice: jest.fn(),
  },
}));

function asPromise<T>(fn: T): () => { promise: T } {
  return jest.fn(() => ({ promise: fn }));
}

test('it interactively completes the SSO flow', async () => {
  const service = {
    startDeviceAuthorization: asPromise(jest.fn().mockResolvedValue({
      verificationUri: 'https://example.com',
      verificationUriComplete: 'https://example.com/complete',
      userCode: '1234',
      deviceCode: 'device-code',
      interval: 0.2,
    })),
    createToken: asPromise(jest.fn()
      .mockRejectedValueOnce({
        // waiting invite
        code: 'AuthorizationPendingException',
        message: 'Authorization pending',
      })
      .mockResolvedValue({
        // success
        accessToken: 'access-token',
        expiresIn: 3600,
      })),
  } as unknown as AWS.SSOOIDC;
  const clientInfo: ClientInfo = {
    clientId: 'test-client-id',
    clientSecret: 'test',
    clientSecretExpiresAt: (Date.now() / 1000) + 30 * 60,
  };
  const params = {
    startUrl: 'https://test.awsapps.com/start',
    region: 'us-east-1',
  };

  const response = await getFreshSsoToken(service, clientInfo, params);
  expect(open).toHaveBeenCalledWith('https://example.com/complete');
  expect(response).toEqual({
    startUrl: 'https://test.awsapps.com/start',
    region: 'us-east-1',
    accessToken: 'access-token',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    expiresAt: expect.any(String),
  });
  expect(new Date(response.expiresAt).getTime()).toBeGreaterThan(Date.now());

  const text = m(log.notice).mock.calls[0][0];
  expect(text).toContain('https://example.com');
  expect(text).toContain('1234');
});
