/* eslint-disable */
import Serverless from 'serverless';
import type ServerlessBetterCredentialsType from '../ServerlessBetterCredentials';

// @ts-ignore - emulate serverless plugin require process
const ServerlessBetterCredentials: typeof ServerlessBetterCredentialsType = require('..');

const log = {
  error: console.log,
  warning: console.log,
  notice: console.log,
  info: console.log,
  debug: console.log,
  verbose: console.log,
  success: console.log,
}

test('inits', () => {
  const sls = new Serverless({ commands: ['print'], options: {}, serviceDir: null });
  const plugin = new ServerlessBetterCredentials(sls, null, { log, writeText: console.log });
  expect(plugin).toBeTruthy();
});
