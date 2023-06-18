import { IniFileContent, IniLoader, LoadFileOptions } from 'aws-sdk/lib/shared-ini/ini-loader';
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

export type CredentialsOptions = {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
};

export type SSOToken = {
  startUrl: string,
  region: string,
  accessToken: string,
  expiresAt: string, // utc date string
};

export type ClientInfo = {
  clientId: string,
  clientSecret: string,
  clientSecretExpiresAt: number, // in unix epoch seconds
};

export type SsoProfileConfig = {
  sso_account_id: string,
  sso_region: string,
  sso_role_name: string,
  sso_start_url: string,
  sso_session?: string,
};

export type ConfigData = {
  config: IniFileContent;
  keys: string[];
  values: Record<string, string>[];
};

export type SsoIniLoader =
   IniLoader & {
     loadSsoSessionsFrom(options: LoadFileOptions): IniFileContent;
   };
