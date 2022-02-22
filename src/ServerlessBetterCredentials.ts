import Serverless from 'serverless';
import Plugin from 'serverless/classes/Plugin';
import { AwsProvider } from './types';
import getCredentials from './utils/getCredentials';

export default class ServerlessBetterCredentials implements Plugin {
  hooks: { initialize?: () => Promise<void> } = {};

  private provider: AwsProvider;

  private serverless: Serverless;

  constructor(
    serverless: Serverless,
    _?: unknown, // no options are supported
    context?: Plugin.Logging, // it is not clear context is always available
  ) {
    const log = context?.log || console;

    this.serverless = serverless;
    this.provider = this.serverless.getProvider('aws') as unknown as AwsProvider;

    if (!this.provider) {
      log.error('serverless-better-credentials: only AWS is supported');
      return;
    }

    this.provider.getCredentials = getCredentials;
    log.debug('serverless-better-credentials: provider.getCredentials patched');

    this.hooks = { initialize: () => this.init() };
  }

  async init() {
    // Serverless treats the credentials object as if it is a synchronous and static map of
    // { accessKeyId, secretAccessKey, sessionToken? }.
    // However many types of AWS credentials mutate (refresh) over time and are asynchronous on
    // first access.

    // By running getPromise() on the (awaited) plug-in initialisation we can mimic an environment
    // where the key id, secret and token are set immediately, while still providing a valid
    // credentials class for the aws-sdk, etc. that supports refreshing.
    const { credentials } = this.provider.getCredentials();
    await credentials.getPromise();
  }
}
