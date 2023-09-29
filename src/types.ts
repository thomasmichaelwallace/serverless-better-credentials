import { IniFileContent, IniLoader, LoadFileOptions } from 'aws-sdk/lib/shared-ini/ini-loader';
import Serverless from 'serverless';
import Aws from 'serverless/plugins/aws/provider/awsProvider';

export type BetterCredentialsPluginOptions = {
  /**
   * Use this flag to turn off the plugin entirely, which you may want for certain stages.
   * Allows strings to make it easier to use environment variables with serverless.
   * @default true
   */
  enabled?: boolean | string;
};

export type ServerlessWithCustom = Serverless & {
  service: {
    custom: {
      betterCredentials?: BetterCredentialsPluginOptions;
    }
  }
};

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

export type SsoIniLoader =
   IniLoader & {
     /** New method in aws-sdk.
      *
      * Considered optional, in case aws-sdk peer-dependency
      * is not installed at the correct version.
      *
      * See https://github.com/aws/aws-sdk-js/pull/4456 to add this method to aws-sdk types.
      * */
     loadSsoSessionsFrom?: (options: LoadFileOptions) => IniFileContent;
     getDefaultFilePath(isConfig: boolean): string;
   };
