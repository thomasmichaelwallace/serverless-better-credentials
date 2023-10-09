import AWS from 'aws-sdk';
import AwsCredentials from '..';
import SsoCredentials from '../../SsoCredentials';

test('constructs a chainable provider', async () => {
  const hintFn = jest.fn();

  const awsCredentials = new AwsCredentials(hintFn);
  expect(awsCredentials.expired).toBe(true); // indicate that credentials are unresolved

  // add from env (first provider to resolve wins)
  process.env.TEST_ACCESS_KEY_ID = 'ENV_ACCESS_KEY_ID';
  process.env.TEST_SECRET_ACCESS_KEY = 'ENV_SECRET_ACCESS_KEY';
  awsCredentials.addEnvironment('test_env', 'TEST');
  expect(awsCredentials.chain.providers).toHaveLength(1);

  // add direct (non-preferred)
  awsCredentials.addConfig('test_config', {
    accessKeyId: 'TEST_ACCESS_KEY_ID',
    secretAccessKey: 'TEST_SECRET_ACCESS_KEY',
  });
  expect(awsCredentials.chain.providers).toHaveLength(2);

  // force resolve
  await awsCredentials.refreshPromise();
  expect(awsCredentials.accessKeyId).toBe('ENV_ACCESS_KEY_ID');
  expect(awsCredentials.secretAccessKey).toBe('ENV_SECRET_ACCESS_KEY');
  expect(awsCredentials.expired).toBe(false);
  expect(hintFn).toHaveBeenCalledWith('credentials resolved from env: test_env');

  // clear env, so first provider is now invalid
  process.env = {};
  awsCredentials.hintShown = false; // reset hint
  await awsCredentials.refreshPromise();
  expect(awsCredentials.accessKeyId).toBe('TEST_ACCESS_KEY_ID');
  expect(awsCredentials.secretAccessKey).toBe('TEST_SECRET_ACCESS_KEY');
  expect(awsCredentials.expired).toBe(false);
  expect(hintFn).toHaveBeenCalledWith('credentials resolved from config: test_config');
});

test('resolves profiles as ini, sso then process', () => {
  const awsCredentials = new AwsCredentials(() => {});
  awsCredentials.addProfile('profile', 'test_profile');
  expect(awsCredentials.chain.providers).toHaveLength(6);
  // @ts-expect-error - we know this is callable
  expect(awsCredentials.chain.providers[0]()).toBeInstanceOf(AWS.SharedIniFileCredentials);
  // @ts-expect-error - we know this is callable
  expect(awsCredentials.chain.providers[1]()).toBeInstanceOf(SsoCredentials);
  // @ts-expect-error - we know this is callable
  expect(awsCredentials.chain.providers[2]()).toBeInstanceOf(AWS.ProcessCredentials);
  // @ts-expect-error - we know this is callable
  expect(awsCredentials.chain.providers[3]()).toBeInstanceOf(AWS.ECSCredentials);
  // @ts-expect-error - we know this is callable
  expect(awsCredentials.chain.providers[4]()).toBeInstanceOf(AWS.TokenFileWebIdentityCredentials);
  // @ts-expect-error - we know this is callable
  expect(awsCredentials.chain.providers[5]()).toBeInstanceOf(AWS.EC2MetadataCredentials);
});
