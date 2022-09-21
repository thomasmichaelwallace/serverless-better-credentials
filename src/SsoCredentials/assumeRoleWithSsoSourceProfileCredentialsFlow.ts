import AWS from 'aws-sdk';
import AWSUtil from 'aws-sdk/lib/util';
import path from 'path';

import { AssumeRoleWithSsoSourceProfileCredentialsConfig,
  AwsTemporaryCredentials } from 'src/types';
import isAssumeRoleCredentials from '../utils/isAssumeRoleCredentials';
import isFullRoleCredentials from '../utils/isFullRoleCredentials';
import getSsoToken from './getSsoToken';

export default async function assumeRoleWithSsoSourceProfileCredentialsFlow(
  config: AssumeRoleWithSsoSourceProfileCredentialsConfig,
  services: { ssoOidc: AWS.SSOOIDC; sso: AWS.SSO; sts: AWS.STS | undefined },
): Promise<AwsTemporaryCredentials> {
  const getSsoTokenParams = {
    cacheBasePath: path.join(AWSUtil.iniLoader.getHomeDir(), '.aws', 'sso', 'cache'),
    region: config.source.sso_region,
    startUrl: config.source.sso_start_url,
  };

  return getSsoToken(services.ssoOidc, getSsoTokenParams)
    .then((token) => {
      const getRoleCredentialsParams: AWS.SSO.GetRoleCredentialsRequest = {
        accessToken: token.accessToken,
        accountId: config.source.sso_account_id,
        roleName: config.source.sso_role_name,
      };
      return services.sso.getRoleCredentials(getRoleCredentialsParams).promise();
    })
    .then(({ roleCredentials }) => {
      if (!isFullRoleCredentials(roleCredentials)) {
        throw new Error('An error occurred fetching SSO credentials role');
      }

      if (
        !services.sts
        || services.sts.config.credentials?.accessKeyId !== roleCredentials.accessKeyId
        || services.sts.config.credentials?.secretAccessKey !== roleCredentials.secretAccessKey
        || services.sts.config.credentials?.sessionToken !== roleCredentials.sessionToken
      ) {
        // eslint-disable-next-line no-param-reassign
        services.sts = new AWS.STS({
          credentials: {
            accessKeyId: roleCredentials.accessKeyId,
            secretAccessKey: roleCredentials.secretAccessKey,
            sessionToken: roleCredentials.sessionToken,
          },
        });
      }

      const assumeRoleParams = {
        RoleArn: config.profile.role_arn,
        RoleSessionName: `serverless-better-credentials-${new Date().getTime()}`,
      };

      return services.sts.assumeRole(assumeRoleParams).promise();
    })
    .then(({ Credentials }) => {
      if (!isAssumeRoleCredentials(Credentials)) {
        throw new Error('An error occurred fetching AssumeRole temporary credentials');
      }

      return {
        accessKeyId: Credentials.AccessKeyId,
        expired: false,
        expireTime: Credentials.Expiration,
        secretAccessKey: Credentials.SecretAccessKey,
        sessionToken: Credentials.SessionToken,
      };
    });
}
