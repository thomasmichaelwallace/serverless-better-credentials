import path from 'path';
import { ClientInfo } from '../types';
import thruCache from '../utils/thruCache';

const MAX_WAIT_TIME = 10 * 60 * 1000; // give people ten minutes

function isValidClientInfo(j: unknown): j is ClientInfo {
  if (j === undefined || j === null) return false;
  if (typeof j !== 'object') return false;
  if (!('clientId' in j && 'clientSecret' in j && 'clientSecretExpiresAt' in j)) return false;
  if (typeof (j as ClientInfo).clientId !== 'string') return false;
  if (typeof (j as ClientInfo).clientSecret !== 'string') return false;
  if (typeof (j as ClientInfo).clientSecretExpiresAt !== 'number') return false;
  const expiresAt = (j as ClientInfo).clientSecretExpiresAt * 1000;
  if (Number.isNaN(expiresAt)) return false;
  if ((expiresAt - Date.now()) < MAX_WAIT_TIME) return false; // expired, or will expire soon
  return true;
}

export default function getClientInfo(
  service: AWS.SSOOIDC,
  params: { cacheBasePath: string, region: string },
): Promise<ClientInfo> {
  // it looks as though SSOOIDC is cached per-region
  const clientFile = `better-serverless-credentials-id-${params.region}.json`;
  const cachePath = path.join(params.cacheBasePath, clientFile);

  return thruCache(
    cachePath,
    isValidClientInfo,
    async () => {
      const clientName = `better-serverless-credentials-client-${Math.floor(Date.now() / 1000)}`;
      const clientInfo = await service.registerClient({ clientName, clientType: 'public' }).promise();
      return clientInfo;
    },
  );
}
