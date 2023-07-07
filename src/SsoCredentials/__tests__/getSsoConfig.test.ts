import fs from 'fs';
import path from 'path';
import os from 'os';
import getSsoConfig from '../getSsoConfig';

// force AWS to run the node_loader so that utils are configured with fs and ini loaders
// eslint-disable-next-line import/order, import/newline-after-import
import AWS from 'aws-sdk';
const s3 = new AWS.S3();
s3.apiVersions = ['2006-03-01'];

test('it loads the sso config from a file with the old SSO login', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'serverless-better-credentials-test-'));
  const configPath = path.join(dir, 'config');

  fs.writeFileSync(configPath, `
[testing]
sso_start_url = https://testing.awsapps.com/start
sso_region = eu-west-1
sso_account_id = 1234
sso_role_name = MyRole
  `);

  process.env.AWS_CONFIG_FILE = configPath;

  const config = getSsoConfig({ filename: configPath, profile: 'testing' });

  expect(config).toEqual({
    sso_account_id: '1234',
    sso_region: 'eu-west-1',
    sso_role_name: 'MyRole',
    sso_start_url: 'https://testing.awsapps.com/start',
  });

  fs.rmSync(dir, { recursive: true });
});

test('it loads the sso config from a file with the new SSO login', () => {
  const dir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'serverless-better-credentials-test-'),
  );
  const configPath = path.join(dir, 'config');

  fs.writeFileSync(
    configPath,
    `
      [testing]
      sso_start_url = https://testing.awsapps.com/start
      sso_region = eu-west-1
      sso_account_id = 1234
      sso_role_name = MyRole
      sso_session = test-session

      [sso-session test-session]
      sso_start_url = https://testing.awsapps.com/start
      sso_region = eu-west-1
      sso_registration_scopes = sso:account:access
  `,
  );

  process.env.AWS_CONFIG_FILE = configPath;

  const config = getSsoConfig({ filename: configPath, profile: 'testing' });

  expect(config).toEqual({
    sso_account_id: '1234',
    sso_region: 'eu-west-1',
    sso_role_name: 'MyRole',
    sso_session: 'test-session',
    sso_start_url: 'https://testing.awsapps.com/start',
  });

  fs.rmSync(dir, { recursive: true });
});

test('it fails to load invalid sso config from a file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'serverless-better-credentials-test-'));
  const configPath = path.join(dir, 'config');

  fs.writeFileSync(configPath, `
[testing]
aws_access_key_id=MY_ACCESS_KEY
aws_secret_access_key=MY_SECRET_KEY
  `);

  expect(() => getSsoConfig({ filename: configPath, profile: 'testing' })).toThrow();

  fs.rmSync(dir, { recursive: true });
});
