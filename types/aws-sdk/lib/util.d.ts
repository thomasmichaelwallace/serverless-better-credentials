type PrivateIniLoader = AWS.IniLoader & {
  getHomeDir(): string;
};

// AWS.util is private, but also heavily used in building credentials.
// Until https://github.com/aws/aws-sdk-js/pull/3736 is merged, we need this
// to define SSO credentials.
type Util = {
  defaultProfile: string;
  error(error: Error, { code: string }): AWS.AWSError;
  fn: {
    noop: () => void;
    callback: (err?: AWS.AWSError) => void;
  }
  iniLoader: PrivateIniLoader,
  getProfilesFromSharedConfig<C>(
    iniLoader: IniLoader,
    filename?: string,
  ): Record<string, C>
  readFileSync: (path: string) => string;
};

declare module 'aws-sdk/lib/util' {
  const util: Util;
  export default util;
}
