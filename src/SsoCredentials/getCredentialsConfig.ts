import AWSUtil from 'aws-sdk/lib/util';
import { AssumeRoleWithSsoSourceProfileCredentialsConfig, ProfileConfig, SsoCredentialsConfig, SsoProfileConfig } from '../types';

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

export default function getCredentialsConfig(
  options: { filename?: string, profile?: string },
  // eslint-disable-next-line @typescript-eslint/unbound-method
  getProfiles = AWSUtil.getProfilesFromSharedConfig<ProfileConfig>,
  iniLoader = AWSUtil.iniLoader,
): SsoCredentialsConfig | AssumeRoleWithSsoSourceProfileCredentialsConfig {
  if (!options.profile) throw new Error('Cannot load SSO credentials without a profile');

  const profiles = getProfiles(iniLoader, options.filename);
  const profile = profiles[options.profile];

  if (profile.role_arn) {
    const sourceProfileName = profile.source_profile;

    if (!sourceProfileName) {
      throw new Error(`source_profile is not set using profile ${options.profile}`);
    }

    const sourceProfile = profiles[sourceProfileName];

    if (typeof sourceProfile !== 'object') {
      throw new Error(
        `source_profile ${sourceProfileName} of the profile ${options.profile} does not exist`,
      );
    }

    if (!isSsoProfileConfig(sourceProfile)) {
      throw new Error(
        `Source profile of ${options.profile} does not have valid SSO credentials. Required `
          + 'parameters "sso_account_id", "sso_region", "sso_role_name", '
          + '"sso_start_url". Reference: '
          + 'https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html',
      );
    }

    return {
      profile: {
        role_arn: profile.role_arn,
        source_profile: sourceProfileName,
      },
      source: {
        sso_account_id: sourceProfile.sso_account_id,
        sso_region: sourceProfile.sso_region,
        sso_role_name: sourceProfile.sso_role_name,
        sso_start_url: sourceProfile.sso_start_url,
      },
    };
  }

  if (!isSsoProfileConfig(profile)) {
    throw new Error(
      `Profile ${options.profile} does not have valid SSO credentials. Required `
        + 'parameters "sso_account_id", "sso_region", "sso_role_name", '
        + '"sso_start_url". Reference: '
        + 'https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html',
    );
  }

  return {
    profile: {
      sso_account_id: profile.sso_account_id,
      sso_region: profile.sso_region,
      sso_role_name: profile.sso_role_name,
      sso_start_url: profile.sso_start_url,
    },
  };
}
