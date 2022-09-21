export default function isFullRoleCredentials(
  c: AWS.SSO.GetRoleCredentialsResponse['roleCredentials'],
): c is { accessKeyId: string; secretAccessKey: string; sessionToken: string; expiration: number } {
  if (!c) return false;
  if (!c.accessKeyId) return false;
  if (!c.secretAccessKey) return false;
  if (!c.sessionToken) return false;
  if (!c.expiration) return false;
  return true;
}
