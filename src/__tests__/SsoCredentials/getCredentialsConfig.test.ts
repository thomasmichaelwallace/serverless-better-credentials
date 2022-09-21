import getCredentialsConfig from '../../SsoCredentials/getCredentialsConfig';
import { AssumeRoleWithSsoSourceProfileCredentialsConfig, SsoCredentialsConfig } from '../../types';

describe('sum module', () => {
  const getProfiles = jest.fn();
  const iniLoader = {
    clearCachedFiles: jest.fn(),
    loadFrom: jest.fn(),
    getHomeDir: jest.fn(),
  };

  it('should thtow an error when profile name is not provided', () => {
    // given
    const options = { profile: undefined };
    // when
    expect(() => getCredentialsConfig(options, getProfiles, iniLoader))
      // then
      .toThrow(/Cannot load SSO credentials without a profile/);
  });

  it('should throw an error when source profile is not set', () => {
    // given
    const options = { profile: 'profile_one' };
    getProfiles.mockReturnValue({ [options.profile]: { role_arn: 'role_arn' } });
    // when
    expect(() => getCredentialsConfig(options, getProfiles, iniLoader))
      // then
      .toThrow(/source_profile is not set using profile/);
  });

  it('should throw an error when source profile does not exist', () => {
    // given
    const options = { profile: 'profile_one' };
    const profiles = { [options.profile]: { role_arn: 'role_arn', source_profile: 'source_profile_name' } };
    getProfiles.mockReturnValue(profiles);
    // when
    expect(() => getCredentialsConfig(options, getProfiles, iniLoader))
      // then
      .toThrow(/source_profile \S+ of the profile \S.+ does not exist/);
  });

  it('should throw an error when source profile is not sso profile', () => {
    // given
    const options = { profile: 'profile_one' };
    const profile = { role_arn: 'role_arn', source_profile: 'source_profile_name' };
    const sourceProfile = { sso_account_id: 'id_id_123' };
    const profiles = { [options.profile]: profile, [profile.source_profile]: sourceProfile };
    getProfiles.mockReturnValue(profiles);
    // when
    expect(() => getCredentialsConfig(options, getProfiles, iniLoader))
      // then
      .toThrow(/Source profile of \S+ does not have valid SSO credentials/);
  });

  it('should throw an error when config is not valid sso profile', () => {
    // given
    const options = { profile: 'profile_one' };
    const profile = { sso_account_id: 'id_id_123' };
    const profiles = { [options.profile]: profile };
    getProfiles.mockReturnValue(profiles);
    // when
    expect(() => getCredentialsConfig(options, getProfiles, iniLoader))
      // then
      .toThrow(/Profile \S+ does not have valid SSO credentials/);
  });

  it('should return sso profile config', () => {
    // given
    const options = { profile: 'profile_one' };
    const profile = {
      sso_account_id: 'id_id_123',
      sso_region: 'eu-weu',
      sso_role_name: 'rol',
      sso_start_url: 'aws.com',
    };
    const profiles = { [options.profile]: profile };
    getProfiles.mockReturnValue(profiles);
    // when
    const result = getCredentialsConfig(options, getProfiles, iniLoader);
    // then
    expect(result).toMatchObject<SsoCredentialsConfig>({
      profile: {
        sso_account_id: profile.sso_account_id,
        sso_region: profile.sso_region,
        sso_role_name: profile.sso_role_name,
        sso_start_url: profile.sso_start_url,
      },
    });
  });

  it('should return role profile and source sso profile config', () => {
    // given
    const options = { profile: 'profile_one' };
    const profile = { role_arn: 'role_arn', source_profile: 'source_profile_name' };
    const sourceProfile = {
      sso_account_id: 'id_id_123',
      sso_region: 'eu-weu',
      sso_role_name: 'rol',
      sso_start_url: 'aws.com',
    };
    const profiles = { [options.profile]: profile, [profile.source_profile]: sourceProfile };
    getProfiles.mockReturnValue(profiles);
    // when
    const result = getCredentialsConfig(options, getProfiles, iniLoader);
    // then
    expect(result).toMatchObject<AssumeRoleWithSsoSourceProfileCredentialsConfig>({
      profile: {
        role_arn: profile.role_arn,
        source_profile: profile.source_profile,
      },
      source: {
        sso_account_id: sourceProfile.sso_account_id,
        sso_region: sourceProfile.sso_region,
        sso_role_name: sourceProfile.sso_role_name,
        sso_start_url: sourceProfile.sso_start_url,
      },
    });
  });
});
