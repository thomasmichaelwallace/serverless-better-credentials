import AWS from 'aws-sdk';
import path from 'path';
import AWSUtil from 'aws-sdk/lib/util';

import {
  AssumeRoleWithSsoSourceProfileCredentialsConfig,
  AwsTemporaryCredentials,
} from 'src/types';
import getSsoToken from './getSsoToken';
import isFullRoleCredentials from '../utils/isFullRoleCredentials';
import isAssumeRoleCredentials from '../utils//isAssumeRoleCredentials';

export default async function assumeRoleWithSsoSourceProfileCredentialsFlow(
  config: AssumeRoleWithSsoSourceProfileCredentialsConfig,
  services: { ssoOidcService: AWS.SSOOIDC; ssoService: AWS.SSO; stsService: AWS.STS | undefined },
): Promise<AwsTemporaryCredentials> {
  const getSsoTokenParams = {
    cacheBasePath: path.join(AWSUtil.iniLoader.getHomeDir(), '.aws', 'sso', 'cache'),
    region: config.source.sso_region,
    startUrl: config.source.sso_start_url,
  };

  return getSsoToken(services.ssoOidcService, getSsoTokenParams)
    .then((token) => {
      const getRoleCredentialsParams: AWS.SSO.GetRoleCredentialsRequest = {
        accessToken: token.accessToken,
        accountId: config.source.sso_account_id,
        roleName: config.source.sso_role_name,
      };
      return services.ssoService.getRoleCredentials(getRoleCredentialsParams).promise();
    })
    .then(({ roleCredentials }) => {
      if (!isFullRoleCredentials(roleCredentials)) {
        throw new Error('An error occurred fetching SSO credentials role');
      }

      if (
        !services.stsService ||
        services.stsService.config.credentials?.accessKeyId !== roleCredentials.accessKeyId ||
        services.stsService.config.credentials?.secretAccessKey !== roleCredentials.secretAccessKey ||
        services.stsService.config.credentials?.sessionToken !== roleCredentials.sessionToken
      ) {
        services.stsService = new AWS.STS({
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

      return services.stsService.assumeRole(assumeRoleParams).promise();
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
