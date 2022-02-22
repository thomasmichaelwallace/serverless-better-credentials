import { AWSError, IniLoader } from 'aws-sdk';

type PrivateIniLoader = IniLoader & {
  getHomeDir(): string;
};

// AWS.util is private, but also heavily used in building credentials.
// Until https://github.com/aws/aws-sdk-js/pull/3736 is merged, we need this
// to define SSO credentials.
type Util = {
  defaultProfile: string;
  error(error: Error, { code: string }): AWSError;
  fn: {
    noop: () => void;
    callback: (err?: AWSError) => void;
  }
  iniLoader: PrivateIniLoader,
  getProfilesFromSharedConfig<C>(
    iniLoader: IniLoader,
    filename?: string,
  ): Record<string, C>
  readFileSync: (path: string) => string;
};

declare global {
  namespace AWS {
    const util: Util;
  }
}
