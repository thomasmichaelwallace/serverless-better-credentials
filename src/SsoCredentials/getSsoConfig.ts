import AWSUtil from 'aws-sdk/lib/util';
import { SsoProfileConfig } from '../types';

function isSsoProfileConfig(c: unknown): c is SsoProfileConfig {
  if (c === undefined || c === null) return false;
  if (typeof c !== 'object') return false;
  if (
    !(
      'sso_account_id' in c
      && 'sso_region' in c
      && 'sso_role_name' in c
      && 'sso_start_url' in c
    )
  ) return false;
  if (typeof (c as SsoProfileConfig).sso_account_id !== 'string') return false;
  if (typeof (c as SsoProfileConfig).sso_region !== 'string') return false;
  if (typeof (c as SsoProfileConfig).sso_role_name !== 'string') return false;
  if (typeof (c as SsoProfileConfig).sso_start_url !== 'string') return false;
  return true;
}

export default function getSsoConfig(
  options: { filename?: string, profile?: string },
): SsoProfileConfig {
  if (!options.profile) throw new Error('Cannot load SSO credentials without a profile');
  const profiles = AWSUtil.getProfilesFromSharedConfig<SsoProfileConfig>(
    AWSUtil.iniLoader,
    options.filename,
  );
  const config = profiles[options.profile];
  if (!isSsoProfileConfig(config)) {
    throw new Error(
      `Profile ${options.profile} does not have valid SSO credentials. Required `
      + 'parameters "sso_account_id", "sso_region", "sso_role_name", '
      + '"sso_start_url". Reference: '
      + 'https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html',
    );
  }
  return config;
}
