import Serverless from 'serverless';
import Plugin from 'serverless/classes/Plugin';
import { AwsProvider } from './types';
import getCredentials from './utils/getCredentials';

export default class ServerlessBetterCredentials implements Plugin {
  hooks: { initialize?: () => Promise<void> } = {};

  private provider: AwsProvider;

  private serverless: Serverless;

  constructor(serverless: Serverless, _: unknown, { log }: Plugin.Logging) {
    this.serverless = serverless;
    this.provider = this.serverless.getProvider('aws') as unknown as AwsProvider;

    if (!this.provider) {
      log.error('ServerlessBetterCredentials: AWS provider not found');
      return;
    }

    this.provider.getCredentials = getCredentials;
    log.info('ServerlessBetterCredentials: loaded');

    this.hooks = { initialize: () => this.init() };
  }

  async init() {
    // serverless treats the credentials object as if it is a synchronous and static map of
    // { accessKeyId, secretAccessKey }.
    // however many types of AWS credentials mutate (refresh) over time and are asynchronous.

    // by running getPromise() on the plug-in initialisation we can mimic an environment where
    // the id and secret key are set immediately, while still providing a valid credentials
    // object for the aws-sdk, etc. that supports refreshing.

    const { credentials } = this.provider.getCredentials();
    await credentials.getPromise();
  }
}
