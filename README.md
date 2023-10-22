# Serverless Better Credentials

The Serverless Better Credentials plugin replaces the existing AWS credential resolution mechanism in the Serverless Framework with an extended version that:

* Supports [AWS Single Sign On](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html) natively.
* Supports the [`credential_process`](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sourcing-external.html) mechanism for sourcing credentials from an external process.
* Respects _all_ of the configuration environmental variables that the javascript aws-sdk v2 supports (e.g. `AWS_SHARED_CREDENTIALS_FILE` / `AWS_SDK_LOAD_CONFIG`).

It is designed to be a drop-in replacement; respecting the current credentials resolution order and extensions already provided by the Serverless Framework.

## Usage

1. Install

```bash
npm install --save-dev serverless-better-credentials
# or
yarn add --dev serverless-better-credentials
```

2. Configure

Add the following to your serverless.yml:

```yaml
plugins:
  - serverless-better-credentials # as the first plugin
  # - ... other plugins
```

The following options are supported:

```yaml
custom:
  betterCredentials:
    # Use this flag to turn off the plugin entirely, which you may want for certain stages.
    # Defaults to true.
    enabled: true
```

## AWS Single Sign On (SSO) Support

AWS SSO profiles configured to work with the AWS CLI should "just work" when this plugin is enabled. This includes prompting and attempting to automatically open the SSO authorization page in your default browser when the credentials require refreshing.

Full details about how to configure AWS SSO can be found in the [AWS CLI documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html).

Take note that if you are using SSO with the approach AWS document (a shared `.aws/config` file) you'll also need to set the `AWS_SDK_LOAD_CONFIG` enviornment value to something truthy (e.g. `AWS_SDK_LOAD_CONFIG=1`), as described in the [AWS SDK documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-region.html#setting-region-config-file).

## Other Credential Resolution

Credentials are resolved in the same order the Serverless Framework currently uses. This order is:

 * from **profile**: cli flag `--aws-profile`
 * from **profile**: env `AWS_${STAGE}_PROFILE`
 * from **env** - `AWS_${STAGE}_X`
 * from **profile** - `AWS_PROFILE`
 * from **env** - `AWS_X`
 * from **profile** - serverless.yml > `provider.profile` (unless --aws-profile is specified)
 * from **config** - serverless.yml > `provider.credentials`
 * from **profile** - `AWS_DEFAULT_PROFILE` || `default`
 * from the ECS provider
 * from the token file identity
 * from the EC2 instance metadata service

Where:
 * **profile** credentials resolve against the matching `[profile_name]` configuration:
   * first directly as [SharedIniFileCredentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SharedIniFileCredentials.html) (i.e. key id/secret or STS role)
   * then using [ProcessCredentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ProcessCredentials.html), if an `credential_process` is specified
   * then using the built-in [SSO Credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html) if `sso_start_url`, etc. is specified
 * **env** credentials resolve as [EnvironmentCredentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EnvironmentCredentials.html) (i.e. from the running process environment)
 * **config** credentials resolve directly as [Credentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html) (i.e. from an explicitly set key id and secret)

## Help and Support

If you have an issue, suggestion, or want to contribute, please open an issue or create a pull request and I'll take a look.

### Troubleshooting

There are a handful of common issues that people have trying to run this plugin. Mostly they surround either the confusing way that AWS resolves credentials, or the way that the Serverless Framework loads plugins.

It's always worth trying the following steps (but feel free to raise an issue if you're still having problems):

* If you're using an `~/.aws/config` file, make sure you have `AWS_SDK_LOAD_CONFIG=1` set in your environment
* Make sure you're not using a global installation of serverless (e.g. run `npm install --save-dev serverless` in your project directory)

If you are having trouble in a CI/CD environment (like GitHub actions), it is probably because you are using a plugin that has migrated to AWS-SDK v3. The easiest workaround is to add a step where you create the `~/.aws/credentials` file, for example:

```bash
mkdir -p ~/.aws
rm -rf ~/.aws/credentials
echo "[YOUR_PROFILE_NAME]" >> ~/.aws/credentials
echo "aws_access_key_id = ${AWS_ACCESS_KEY_ID}" >> ~/.aws/credentials
echo "aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}" >> ~/.aws/credentials
echo "aws_session_token = ${AWS_SESSION_TOKEN}" >> ~/.aws/credentials
echo "region = eu-west-1" >> ~/.aws/credentials
echo "output = json" >> ~/.aws/credentials
```
