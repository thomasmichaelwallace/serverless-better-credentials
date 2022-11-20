import AWS from 'aws-sdk';
import SsoCredentials from '..';
import getSsoConfig from '../getSsoConfig';
import getSsoToken from '../getSsoToken';

jest.mock('../getSsoConfig');
jest.mock('../getSsoToken');
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
jest.mock('aws-sdk', () => ({
  ...jest.requireActual('aws-sdk'),
  SSO: jest.fn(),
}));

test('it loads and refreshes SSO credentials', async () => {
  m(getSsoConfig).mockReturnValue({
    sso_account_id: 'ACCOUNT_ID',
    sso_region: 'REGION',
    sso_role_name: 'ROLE_NAME',
    sso_start_url: 'START_URL',
  });
  m(getSsoToken).mockResolvedValueOnce({
    startUrl: 'START_URL',
    region: 'REGION',
    accessToken: 'ACCESS_TOKEN',
    expiresAt: (new Date(Date.now() + 60 * 60 * 1000)).toISOString(),
  });

  // @ts-expect-error - partial mock-implementation of constructor
  mc(AWS.SSO).mockImplementationOnce(() => ({
    getRoleCredentials: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValueOnce({
        roleCredentials: {
          accessKeyId: 'SSO_ACCESS_KEY_ID',
          secretAccessKey: 'SSO_SECRET_ACCESS',
          sessionToken: 'SSO_SESSION_TOKEN',
          expiration: (new Date(Date.now() + 60 * 60 * 1000)).toISOString(),
        },
      }),
    }),
  }));

  const ssoCredentials = new SsoCredentials({
    filename: 'path/to/config',
    profile: 'my_sso',
  });

  expect(ssoCredentials.expired).toBe(true);

  await ssoCredentials.getPromise();

  expect(ssoCredentials.accessKeyId).toBe('SSO_ACCESS_KEY_ID');
  expect(ssoCredentials.secretAccessKey).toBe('SSO_SECRET_ACCESS');
  expect(ssoCredentials.sessionToken).toBe('SSO_SESSION_TOKEN');
  expect(ssoCredentials.expired).toBe(false);
});
