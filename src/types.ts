import Serverless from 'serverless';
import Aws from 'serverless/plugins/aws/provider/awsProvider';

export type ServerlessAwsCredentials = {
  credentials: AWS.Credentials,
  region: string,
  signatureVersion?: 'v4',
};

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
