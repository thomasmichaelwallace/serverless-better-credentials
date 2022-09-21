import AWS, { AWSError } from 'aws-sdk';
import AWSUtil from 'aws-sdk/lib/util';

import {
  AssumeRoleWithSsoSourceProfileCredentialsConfig,
  ICredentialsFlow,
  SsoCredentialsConfig,
} from '../types';
import isAwsError from '../utils/isAwsError';
import getCredentialsConfig from './getCredentialsConfig';
import ssoCredentialsFlow from './ssoCredentialsFlow';
import assumeRoleWithSsoSourceProfileCredentialsFlow from './assumeRoleWithSsoSourceProfileCredentialsFlow';

function handleError(e: unknown, callback: (err?: AWSError) => void): void {
  if (isAwsError(e)) {
    callback(e);
  } else if (e instanceof Error) {
    const err = e instanceof Error ? e : new Error('An unknown error occurred');
    callback(AWSUtil.error(err, { code: 'SsoCredentialsProviderFailure' }));
  }
}

function isSsoCredentialsConfig(
  c: SsoCredentialsConfig | AssumeRoleWithSsoSourceProfileCredentialsConfig,
): c is SsoCredentialsConfig {
  return !!(<SsoCredentialsConfig>c).profile.sso_account_id;
}

function isAssumeRoleWithSsoSourceProfileCredentialsConfig(
  c: SsoCredentialsConfig | AssumeRoleWithSsoSourceProfileCredentialsConfig,
): c is AssumeRoleWithSsoSourceProfileCredentialsConfig {
  return !!(<AssumeRoleWithSsoSourceProfileCredentialsConfig>c).source;
}

export default class SsoCredentials extends AWS.Credentials {
  private filename: string | undefined;

  private profile: string | undefined;

  private ssoService: AWS.SSO | undefined;

  private ssoOidcService: AWS.SSOOIDC | undefined;

  private stsService: AWS.STS | undefined;

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
      const config = getCredentialsConfig({ filename: this.filename, profile: this.profile });

      let flow: ICredentialsFlow;
      let ssoRegion: string;
      if (isSsoCredentialsConfig(config)) {
        flow = ssoCredentialsFlow;
        ssoRegion = config.profile.sso_region;
      } else if (isAssumeRoleWithSsoSourceProfileCredentialsConfig(config)) {
        flow = assumeRoleWithSsoSourceProfileCredentialsFlow;
        ssoRegion = config.source.sso_region;
      } else {
        throw new Error('AWS profile configuration mismatch.');
      }

      if (!this.ssoOidcService || this.ssoOidcService.config.region !== ssoRegion) {
        this.ssoOidcService = new AWS.SSOOIDC({ region: ssoRegion });
      }

      if (!this.ssoService || this.ssoService.config.region !== ssoRegion) {
        this.ssoService = new AWS.SSO({ region: ssoRegion });
      }

      flow(config, { ssoService: this.ssoService, ssoOidcService: this.ssoOidcService, stsService: this.stsService })
        .then((response) => {
          this.expired = response.expired;
          this.accessKeyId = response.accessKeyId;
          this.secretAccessKey = response.secretAccessKey;
          this.sessionToken = response.sessionToken;
          this.expireTime = response.expireTime;
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
