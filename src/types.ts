import Serverless from 'serverless';
import Aws from 'serverless/plugins/aws/provider/awsProvider';

// serverless/lib/plugins/aws/provider.js - getCredentials (return type)
export type ServerlessAwsCredentials = {
  credentials: AWS.Credentials,
  region: string,
  signatureVersion?: 'v4',
};

// serverless/lib/plugins/aws/provider.js - class AwsProvider
// n.b. this is partial type to match the internals as required by this plugin
export type AwsProvider = Omit<Aws, 'getCredentials'> & {
  getCredentials: () => ServerlessAwsCredentials,
  cachedCredentials: ServerlessAwsCredentials | undefined;
  options: Serverless.Options & { 'aws-profile'?: string };
  serverless: Serverless & {
    service: {
      provider: Aws.Provider & {
        credentials?: CredentialsOptions
        deploymentBucketObject?: { serverSideEncryption?: string }
      }
    },
  }
};

export interface CredentialsOptions {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
}
