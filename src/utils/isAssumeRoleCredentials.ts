export default function isAssumeRoleCredentials(c: AWS.STS.Credentials | undefined): c is {
  AccessKeyId: string;
  Expiration: Date;
  SecretAccessKey: string;
  SessionToken: string;
} {
  if (!c) return false;
  if (!c.AccessKeyId) return false;
  if (!c.Expiration) return false;
  if (!c.SecretAccessKey) return false;
  if (!c.SessionToken) return false;
  return true;
}
