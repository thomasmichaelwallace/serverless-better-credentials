import AWSUtil from 'aws-sdk/lib/util';
import path from 'path';
import { AwsTemporaryCredentials, SsoCredentialsConfig } from 'src/types';
import isFullRoleCredentials from '../utils/isFullRoleCredentials';
import getSsoToken from './getSsoToken';

export default async function ssoCredentialsFlow(
  config: SsoCredentialsConfig,
  services: { ssoOidc: AWS.SSOOIDC; sso: AWS.SSO },
): Promise<AwsTemporaryCredentials> {
  const getSsoTokenParams = {
    cacheBasePath: path.join(AWSUtil.iniLoader.getHomeDir(), '.aws', 'sso', 'cache'),
    region: config.profile.sso_region,
    startUrl: config.profile.sso_start_url,
  };

  return getSsoToken(services.ssoOidc, getSsoTokenParams)
    .then((token) => {
      const getRoleCredentialsParams: AWS.SSO.GetRoleCredentialsRequest = {
        accessToken: token.accessToken,
        accountId: config.profile.sso_account_id,
        roleName: config.profile.sso_role_name,
      };
      return services.sso.getRoleCredentials(getRoleCredentialsParams).promise();
    })
    .then(({ roleCredentials }) => {
      if (!isFullRoleCredentials(roleCredentials)) {
        throw new Error('An error occurred fetching SSO credentials role');
      }

      return {
        accessKeyId: roleCredentials.accessKeyId,
        expired: false,
        expireTime: new Date(roleCredentials.expiration),
        secretAccessKey: roleCredentials.secretAccessKey,
        sessionToken: roleCredentials.sessionToken,
      };
    });
}
