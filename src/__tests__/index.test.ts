/* eslint-disable */
import Serverless from 'serverless';
import type ServerlessBetterCredentialsType from '../ServerlessBetterCredentials';

// @ts-ignore - emulate serverless plugin require process
const ServerlessBetterCredentials: typeof ServerlessBetterCredentialsType = require('..');

test('module can be loaded by the serverless framework', () => {
  const sls = new Serverless({ commands: ['print'], options: {}, serviceDir: null });
  const plugin = new ServerlessBetterCredentials(sls);
  expect(plugin).toBeTruthy();
});
