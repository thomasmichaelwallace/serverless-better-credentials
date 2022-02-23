import crypto from 'crypto';
import path from 'path';
import { SSOToken } from '../types';
import thruCache from '../utils/thruCache';
import getClientInfo from './getClientInfo';
import getFreshSsoToken from './getFreshSsoToken';

type GetSsoTokenParams = {
  cacheBasePath: string,
  region: string,
  startUrl: string
};

const MAX_WAIT_TIME = 10 * 60 * 1000; // give people ten minutes

function isValidSSOToken(j: unknown): j is SSOToken {
  if (j === undefined || j === null) return false;
  if (typeof j !== 'object') return false;
  if (!('accessToken' in j && 'expiresAt' in j)) return false;
  if (typeof (j as SSOToken).accessToken !== 'string') return false;
  const expiresAt = Date.parse((j as SSOToken).expiresAt);
  if (Number.isNaN(expiresAt)) return false;
  if ((expiresAt - Date.now()) < MAX_WAIT_TIME) return false; // expired, or will expire soon
  return true;
}

export default async function getSsoToken(
  service: AWS.SSOOIDC,
  params: GetSsoTokenParams,
): Promise<SSOToken> {
  const hasher = crypto.createHash('sha1');
  const cacheFile = `${hasher.update(params.startUrl).digest('hex')}.json`;
  const cachePath = path.join(params.cacheBasePath, cacheFile);

  return thruCache(
    cachePath,
    isValidSSOToken,
    async () => {
      const clientInfo = await getClientInfo(service, params);
      const token = await getFreshSsoToken(service, clientInfo, params);
      return token;
    },
  );
}
