import { log } from '@serverless/utils/log';
import AwsCredentials from '../AwsCredentials';
import { AwsProvider, ServerlessAwsCredentials } from '../types';

/*
 * This function replaces the existing AWS Provider getCredentials() implementation.
 * It will run within the context of the AWS Provider class.
 */
export default function getCredentials(this: AwsProvider): ServerlessAwsCredentials {
  if (this.cachedCredentials) {
    // We have already created the credentials object once, so return it.
    return this.cachedCredentials;
  }
  log.debug('first attempt to getting aws credentials');

  const credentials = new AwsCredentials((hint) => { log.success(`serverless-better-credentials: ${hint}`); });
  // AwsCredentials returns the first credentials to resolve, so add from most-to-least specific:
  credentials.addProfile('cli --aws-profile', this.options['aws-profile']); // CLI option profile

  const stageUpper = this.getStage() ? this.getStage().toUpperCase() : undefined;
  if (stageUpper) {
    // stage specific credentials
    credentials.addProfile(`AWS_${stageUpper}_PROFILE_*`, process.env[`AWS_${stageUpper}_PROFILE`]);
    credentials.addEnvironment(`AWS_${stageUpper}_*`, `AWS_${stageUpper}`);
  }

  credentials.addProfile('AWS_PROFILE', process.env.AWS_PROFILE); // credentials for all stages
  credentials.addEnvironment('AWS_*', 'AWS');

  if (this.serverless.service.provider.profile && !this.options['aws-profile']) {
    credentials.addProfile('provider.profile', this.serverless.service.provider.profile);
  }
  credentials.addConfig('provider.credentials', this.serverless.service.provider.credentials); // config credentials
  credentials.addProfile('AWS_DEFAULT_PROFILE', process.env.AWS_DEFAULT_PROFILE || 'default');

  // Store the credentials to avoid creating them again (messes up MFA).
  const region = this.getRegion();
  this.cachedCredentials = { credentials, region };

  const { deploymentBucketObject } = this.serverless.service.provider;
  if (
    deploymentBucketObject
    && deploymentBucketObject.serverSideEncryption
    && deploymentBucketObject.serverSideEncryption === 'aws:kms'
  ) {
    this.cachedCredentials.signatureVersion = 'v4';
  }

  return this.cachedCredentials;
}
