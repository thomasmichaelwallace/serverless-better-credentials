import AwsCredentials from '../../AwsCredentials';
import { AwsProvider } from '../../types';
import getCredentials from '../getCredentials';

jest.mock('../../AwsCredentials');

test('enforces order of precedence from the original serverless framework', () => {
  const that = {
    getStage: () => 'got_stage',
    getRegion: () => 'got_region',
    serverless: {
      service: {
        provider: {
          profile: 'provider_profile',
          credentials: {
            accessKeyId: 'my_access_key',
            secretAccessKey: 'my_secret_key',
            sessionToken: 'my_session_token',
          },
        },
      },
    },
    options: { 'aws-profile': 'cli_profile' },
  } as unknown as AwsProvider;

  process.env = {
    AWS_GOT_STAGE_PROFILE: 'got_stage_profile',
    AWS_PROFILE: 'env_profile',
    AWS_DEFAULT_PROFILE: 'default_profile',
  }; // reset environment

  // write configurations
  let calls: string[][] = [];
  jest.spyOn(AwsCredentials.prototype, 'addConfig').mockImplementation((_, credentials) => {
    calls.push(['config', Object.values(credentials || {}).join('/')]);
  });
  jest.spyOn(AwsCredentials.prototype, 'addEnvironment').mockImplementation((_, prefix) => {
    calls.push(['environment', prefix || 'undefined']);
  });
  jest.spyOn(AwsCredentials.prototype, 'addProfile').mockImplementation((_, profile) => {
    calls.push(['profile', profile || 'undefined']);
  });

  const result = getCredentials.call(that);

  /*
    In order of precedence:
      - from --aws-profile CLI option
      - from AWS_STAGE_PROFILE in environment
      - from AWS_STAGE_ACCESS_KEY_ID and AWS_STAGE_SECRET_ACCESS_KEY in environment
      - from AWS_PROFILE in environment
      - from AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in environment
      - from { provider.service } in serverless.yml if _not_ overridden by --aws-profile
      - from profile in AWS_DEFAULT_PROFILE or 'default'

    last checked 19/11/2022 - https://github.com/serverless/serverless/blob/main/lib/plugins/aws/provider.js#L1655
  */
  expect(calls).toEqual([
    ['profile', 'cli_profile'],
    ['profile', 'got_stage_profile'],
    ['environment', 'AWS_GOT_STAGE'],
    ['profile', 'env_profile'],
    ['environment', 'AWS'],
    // technically this is now depreciated, still, it is in use so: https://github.com/serverless/serverless/issues/8356
    ['config', 'my_access_key/my_secret_key/my_session_token'],
    ['profile', 'default_profile'],
  ]);

  // check cache
  expect(that.cachedCredentials).toEqual(result);
  calls = []; // reset calls
  const cached = getCredentials.call(that);
  expect(cached).toEqual(result);

  // verify cli-profile behaviour switch and default profile value
  calls = [];
  that.cachedCredentials = undefined;
  that.options['aws-profile'] = undefined;
  delete process.env.AWS_DEFAULT_PROFILE;

  getCredentials.call(that);

  expect(calls).toEqual([
    ['profile', 'undefined'], // undefined will automatically be skipped
    ['profile', 'got_stage_profile'],
    ['environment', 'AWS_GOT_STAGE'],
    ['profile', 'env_profile'],
    ['environment', 'AWS'],
    ['profile', 'provider_profile'],
    ['config', 'my_access_key/my_secret_key/my_session_token'],
    ['profile', 'default'],
  ]);
});

test('return cached credentials if set', () => {
  const that: AwsProvider = {
    cachedCredentials: 'cached credentials',
  } as unknown as AwsProvider;
  const result = getCredentials.call(that);
  expect(result).toBe('cached credentials');
});
