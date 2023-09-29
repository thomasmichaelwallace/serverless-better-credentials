/* eslint-disable */
import Serverless from 'serverless';
import type ServerlessBetterCredentialsType from '../ServerlessBetterCredentials';
import type { BetterCredentialsPluginOptions } from '../types';

// @ts-ignore - emulate serverless plugin require process
const ServerlessBetterCredentials: typeof ServerlessBetterCredentialsType = require('..');

const credentials = { getPromise: jest.fn(() => Promise.resolve()) };
jest.mock('../utils/getCredentials', () => jest.fn(() => ({ credentials })));

test('module can be loaded by the serverless framework', () => {
  const sls = new Serverless({ commands: ['print'], options: {}, serviceDir: null });
  const plugin = new ServerlessBetterCredentials(sls);
  expect(plugin).toBeTruthy();
});

describe('init', () => {
  // minimum config necessary to initialize serverless the way our plugin requires
  const initServerless = async (betterCredentials?: BetterCredentialsPluginOptions) => {
    const sls = new Serverless({
      commands: [],
      options: {},
      serviceDir: '.',
      configurationFilename: 'serverless.yml',
      configuration: {
        service: 'test',
        provider: 'aws',
        custom: { betterCredentials },
      },
    });
    await sls.init();
    return sls;
  }

  test('init no-ops if disabled', async () => {
    const sls = await initServerless({ enabled: false });
    await new ServerlessBetterCredentials(sls).init();
    expect(credentials.getPromise).not.toHaveBeenCalled();
  });

  test('init fetches credentials if enabled', async () => {
    const sls = await initServerless({ enabled: true });
    await new ServerlessBetterCredentials(sls).init();
    expect(credentials.getPromise).toHaveBeenCalledTimes(1);
  });

  test('init fetches credentials by default', async () => {
    const sls = await initServerless();
    await new ServerlessBetterCredentials(sls).init();
    expect(credentials.getPromise).toHaveBeenCalledTimes(1);
  });
});
