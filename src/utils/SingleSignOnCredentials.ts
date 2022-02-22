import AWS, { AWSError } from 'aws-sdk';
/*
 * Based on the sso credential provider defined by eduardomourar
 * see: https://github.com/aws/aws-sdk-js/pull/3736
 */

import crypto from 'crypto';
import path from 'path';

type ProfileConfig = {
  sso_account_id?: string,
  sso_region?: string,
  sso_role_name?: string,
  sso_start_url?: string,
};

type SsoCache = null | { accessToken: string };

/**
 * Represents credentials loaded from shared credentials file
 * (defaulting to ~/.aws/credentials or defined by the
 * `AWS_SHARED_CREDENTIALS_FILE` environment variable).
 *
 * ## Using SSO credentials
 *
 * The credentials file can specify a credential provider relies on an AWS SSO session:
 *
 *     [default]
 *     sso_account_id = 012345678901
 *     sso_region = us-east-1
 *     sso_role_name = SampleRole
 *     sso_start_url = https://d-abc123.awsapps.com/start
 */
export default class SingleSignOnCredentials extends AWS.Credentials {
  private errorCode = 'SingleSignOnCredentialsProviderFailure';

  filename?: string | undefined;

  profile?: string;

  service?: AWS.SSO;

  /**
   * Creates a new SingleSignOnCredentials object.
   *
   * @param options [map] a set of options
   * @option options profile [String] (AWS_PROFILE env var or 'default')
   *   the name of the profile to load.
   * @option options filename [String] ('~/.aws/credentials' or defined by
   *   AWS_SHARED_CREDENTIALS_FILE process env var)
   *   the filename to use when loading credentials.
   */
  constructor(options: { profile?: string, filename?: string } = {}) {
    super('ACCESS_KEY_ID', 'SECRET_ACCESS_KEY');
    this.expired = true; // force refresh based on chain

    this.filename = options.filename;
    this.profile = options.profile || process.env.AWS_PROFILE || AWS.util.defaultProfile;
    this.get(AWS.util.fn.noop);
  }

  load(callback: (err?: AWSError) => void) {
    // const self = this;
    try {
      const profiles = AWS.util
        .getProfilesFromSharedConfig<ProfileConfig>(AWS.util.iniLoader, this.filename);
      const profile = profiles[this.profile || ''] || {};

      if (!this.profile || Object.keys(profile).length === 0) {
        throw AWS.util.error(
          new Error(`Profile ${this.profile || '"undefined"'} not found`),
          { code: this.errorCode },
        );
      }
      if (!profile.sso_start_url
        || !profile.sso_account_id
        || !profile.sso_region
        || !profile.sso_role_name
      ) {
        throw AWS.util.error(
          new Error(`Profile ${this.profile} does not have valid SSO credentials. Required parameters "sso_account_id", "sso_region", `
          + '"sso_role_name", "sso_start_url". Reference: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html'),
          { code: this.errorCode },
        );
      }

      const hasher = crypto.createHash('sha1');
      const fileName = `${hasher.update(profile.sso_start_url).digest('hex')}.json`;

      const cachePath = path.join(
        AWS.util.iniLoader.getHomeDir(),
        '.aws',
        'sso',
        'cache',
        fileName,
      );
      const cacheFile = AWS.util.readFileSync(cachePath);
      let cacheContent: SsoCache = null;
      if (cacheFile) {
        cacheContent = JSON.parse(cacheFile) as SsoCache;
      }

      if (!cacheContent) {
        throw AWS.util.error(
          new Error(`Cached credentials not found under ${this.profile} profile. Please make sure you log in with "aws sso login" first`),
          { code: this.errorCode },
        );
      }

      if (!this.service || this.service.config.region !== profile.sso_region) {
        this.service = new AWS.SSO({ region: profile.sso_region });
      }
      const request = {
        accessToken: cacheContent.accessToken,
        accountId: profile.sso_account_id,
        roleName: profile.sso_role_name,
      };
      this.service.getRoleCredentials(request, (err, data) => {
        if (err || !data || !data.roleCredentials) {
          callback(AWS.util.error(
            err || new Error('Please log in using "aws sso login"'),
            { code: this.errorCode },
          ));
        } else {
          this.expired = false;
          this.accessKeyId = data.roleCredentials.accessKeyId || 'ACCESS_KEY_ID';
          this.secretAccessKey = data.roleCredentials.secretAccessKey || 'SECRET_ACCESS_KEY';
          this.sessionToken = data.roleCredentials.sessionToken || 'SECRET_TOKEN';
          this.expireTime = new Date(data.roleCredentials.expiration || 0);
          callback();
        }
      });
    } catch (err) {
      const awsErr = AWS.util.error(
        err instanceof Error ? err : new Error('An unknown error occurred fetching SSO credentials'),
        { code: this.errorCode },
      );
      callback(awsErr);
    }
  }

  refresh(callback: (err?: AWSError) => void) {
    AWS.util.iniLoader.clearCachedFiles();
    // @ts-expect-error : coalesceRefresh is a private method
    this.coalesceRefresh(callback || AWS.util.fn.callback); // eslint-disable-line @typescript-eslint/no-unsafe-call, max-len
  }
}
