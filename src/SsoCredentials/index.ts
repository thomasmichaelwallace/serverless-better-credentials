import AWS, { AWSError } from 'aws-sdk';
import AWSUtil from 'aws-sdk/lib/util';
import path from 'path';
import isAwsError from '../utils/isAwsError';
import getSsoConfig from './getSsoConfig';
import getSsoToken from './getSsoToken';

function handleError(e: unknown, callback: (err?: AWSError) => void): void {
  if (isAwsError(e)) {
    callback(e);
  } else if (e instanceof Error) {
    const err = e instanceof Error ? e : new Error('An unknown error occurred');
    callback(AWSUtil.error(err, { code: 'SsoCredentialsProviderFailure' }));
  }
}

function isFullRoleCredentials(
  c: AWS.SSO.GetRoleCredentialsResponse['roleCredentials'],
): c is { accessKeyId: string; secretAccessKey: string; sessionToken: string, expiration: number } {
  if (!c) return false;
  if (!c.accessKeyId) return false;
  if (!c.secretAccessKey) return false;
  if (!c.sessionToken) return false;
  if (!c.expiration) return false;
  return true;
}

export default class SsoCredentials extends AWS.Credentials {
  private filename: string | undefined;

  private profile: string | undefined;

  private ssoService: AWS.SSO | undefined;

  private ssoOidcService: AWS.SSOOIDC | undefined;

  constructor(options: {
    profile?: string,
    filename?: string,
  }) {
    super('ACCESS_KEY_ID', 'SECRET_ACCESS_KEY');
    this.expired = true; // force refresh based on chain

    this.filename = options.filename;
    this.profile = options.profile;
  }

  load(callback: (err?: AWSError) => void) {
    try {
      // get valid config, or throw
      const config = getSsoConfig({ filename: this.filename, profile: this.profile });

      // get access token
      if (!this.ssoOidcService || this.ssoOidcService.config.region !== config.sso_region) {
        this.ssoOidcService = new AWS.SSOOIDC({ region: config.sso_region });
      }
      const getSsoTokenParams = {
        cacheBasePath: path.join(
          AWSUtil.iniLoader.getHomeDir(),
          '.aws',
          'sso',
          'cache',
        ),
        region: config.sso_region,
        startUrl: config.sso_start_url,
      };

      getSsoToken(this.ssoOidcService, getSsoTokenParams)
        .then((token) => {
          // get sso role
          if (!this.ssoService || this.ssoService.config.region !== config.sso_region) {
            this.ssoService = new AWS.SSO({ region: config.sso_region });
          }
          const getRoleCredentialsParams: AWS.SSO.GetRoleCredentialsRequest = {
            accessToken: token.accessToken,
            accountId: config.sso_account_id,
            roleName: config.sso_role_name,
          };
          return this.ssoService.getRoleCredentials(getRoleCredentialsParams).promise();
        })
        .then(({ roleCredentials }) => {
          if (!isFullRoleCredentials(roleCredentials)) {
            throw new Error('An error occurred fetching SSO credentials role');
          }
          this.expired = false;
          this.accessKeyId = roleCredentials.accessKeyId;
          this.secretAccessKey = roleCredentials.secretAccessKey;
          this.sessionToken = roleCredentials.sessionToken;
          this.expireTime = new Date(roleCredentials.expiration);
          callback();
        })
        .catch((e) => { handleError(e, callback); });
    } catch (e) {
      handleError(e, callback);
    }
  }

  refresh(callback: (err?: AWSError) => void) {
    AWSUtil.iniLoader.clearCachedFiles();
    // @ts-expect-error : coalesceRefresh is a private method
    this.coalesceRefresh(callback || AWSUtil.fn.callback); // eslint-disable-line @typescript-eslint/no-unsafe-call, max-len
  }
}
