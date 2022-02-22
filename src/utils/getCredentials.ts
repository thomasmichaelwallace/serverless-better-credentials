import { AwsProvider, ServerlessAwsCredentials } from '../types';
import AwsCredentials from './AwsCredentials';

export default function getCredentials(this: AwsProvider): ServerlessAwsCredentials {
  if (this.cachedCredentials) {
    // We have already created the credentials object once, so return it.
    return this.cachedCredentials;
  }

  const credentials = new AwsCredentials();
  // AwsCredentials returns the first credentials to resolve, so add from most-to-least specific:
  credentials.addProfile(this.options['aws-profile']); // CLI option profile

  const stageUpper = this.getStage() ? this.getStage().toUpperCase() : undefined;
  if (stageUpper) {
    // stage specific credentials
    credentials.addProfile(process.env[`AWS_${stageUpper}_PROFILE`]);
    credentials.addEnvironment(`AWS_${stageUpper}`);
  }

  credentials.addProfile(process.env.AWS_PROFILE); // credentials for all stages
  credentials.addEnvironment('AWS');

  if (this.serverless.service.provider.profile && !this.options['aws-profile']) {
    credentials.addProfile(this.serverless.service.provider.profile);
  }
  credentials.addConfig(this.serverless.service.provider.credentials); // config credentials
  credentials.addProfile(process.env.AWS_DEFAULT_PROFILE || 'default');

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
