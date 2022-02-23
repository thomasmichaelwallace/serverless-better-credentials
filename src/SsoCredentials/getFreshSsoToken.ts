import { log } from '@serverless/utils/log';
import AWS from 'aws-sdk';
import open from 'open';
import { ClientInfo, SSOToken } from '../types';
import isAwsError from '../utils/isAwsError';

type GetFreshSsoTokenParams = {
  startUrl: string,
  region: string,
};

function isFullDeviceAuthResponse(
  r: AWS.SSOOIDC.StartDeviceAuthorizationResponse,
): r is Required<AWS.SSOOIDC.StartDeviceAuthorizationResponse> {
  return !!(r.verificationUri && r.verificationUriComplete
    && r.userCode && r.deviceCode
    && r.interval);
}

function toSSOToken(
  params: GetFreshSsoTokenParams,
  response: AWS.SSOOIDC.CreateTokenResponse,
): SSOToken {
  if (!response.accessToken) throw new Error('Failed to get access token');
  if (!response.expiresIn) throw new Error('Failed to get access token expiration');
  const expiresAt = new Date(Date.now() + response.expiresIn * 1000);
  return {
    startUrl: params.startUrl,
    region: params.region,
    accessToken: response.accessToken,
    expiresAt: expiresAt.toISOString(),
  };
}

const delay = async (ms: number) => new Promise((r) => { setTimeout(r, ms); });

const getSsoMessage = (url: string, code: string): string => `
[serverless-better-credentials]

Attempting to automatically open the SSO authorization page in your default browser.
If the browser does not open or you wish to use a different device to authorize this request, open the following URL:

${url}

Then enter the code:

${code}
`;

async function waitForToken(
  service: AWS.SSOOIDC,
  clientInfo: ClientInfo,
  prompt: Required<AWS.SSOOIDC.StartDeviceAuthorizationResponse>,
): Promise<AWS.SSOOIDC.CreateTokenResponse> {
  let waitTime = prompt.interval * 1000;
  try {
    const token = await service.createToken({
      clientId: clientInfo.clientId,
      clientSecret: clientInfo.clientSecret,
      deviceCode: prompt.deviceCode,
      grantType: 'urn:ietf:params:oauth:grant-type:device_code',
    }).promise();
    return token;
  } catch (e) {
    if (!isAwsError(e)) throw e;
    if (e.code === 'AuthorizationPendingException') {
      // expected
    } else if (e.code === 'SlowDownException') {
      waitTime += (e.retryDelay || prompt.interval) * 1000;
    } else {
      throw (e);
    }
  }
  await delay(waitTime);
  return waitForToken(service, clientInfo, prompt);
}

export default async function getFreshSsoToken(
  service: AWS.SSOOIDC,
  clientInfo: ClientInfo,
  params: GetFreshSsoTokenParams,
): Promise<SSOToken> {
  const prompt = await service.startDeviceAuthorization({
    clientId: clientInfo.clientId,
    clientSecret: clientInfo.clientSecret,
    startUrl: params.startUrl,
  }).promise();

  if (!isFullDeviceAuthResponse(prompt)) {
    throw new Error('Failed to start device authorization');
  }

  const message = getSsoMessage(prompt.verificationUri, prompt.userCode);
  log.notice(message);

  try {
    await open(prompt.verificationUriComplete);
  } catch (_) {
    // failed to open browser
  }

  const token = await waitForToken(service, clientInfo, prompt);
  return toSSOToken(params, token);
}
