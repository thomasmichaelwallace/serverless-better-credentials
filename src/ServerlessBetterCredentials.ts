import { log } from '@serverless/utils/log';
import Plugin from 'serverless/classes/Plugin';
import { AwsProvider, ServerlessWithCustom } from './types';
import getCredentials from './utils/getCredentials';
import evaluateBoolean from './utils/evaluateBoolean';

export default class ServerlessBetterCredentials implements Plugin {
  hooks: { initialize?: () => Promise<void> } = {};

  private provider: AwsProvider;

  private serverless: ServerlessWithCustom;

  constructor(serverless: ServerlessWithCustom) {
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
    if (!evaluateBoolean(this.serverless.service.custom?.betterCredentials?.enabled, true)) {
      log.debug('serverless-better-credentials: plugin is disabled - skipping');
      return;
    }

    // Serverless treats the credentials object as if it is a synchronous and static map of
    // { accessKeyId, secretAccessKey, sessionToken? }.
    // However many types of AWS credentials mutate (refresh) over time and are asynchronous on
    // first access.

    // By running getPromise() on the (awaited) plug-in initialisation we can mimic an environment
    // where the key id, secret and token are set immediately, while still providing a valid
    // credentials class for the aws-sdk, etc. that supports refreshing.
    const { credentials } = this.provider.getCredentials();

    // It seems we're not the only plugin messing with the credentials object.
    // Guard against unexpected usage.
    // https://github.com/thomasmichaelwallace/serverless-better-credentials/issues/5
    if (
      !credentials
      || typeof credentials !== 'object'
      || typeof credentials.getPromise !== 'function'
    ) {
      log.warning('serverless-better-credentials: another plugin has changed the credentials object - skipping');
      return;
    }

    await credentials.getPromise();
  }
}
