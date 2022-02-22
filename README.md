# Serverless Better Credentials

The Serverless Better Credentials plugin replaces the existing AWS credential resolution mechanism in the Serverless Framework with an extended version that:

* Supports the [`credential_process`](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sourcing-external.html) mechanism for sourcing credentials from an external process (used by many SSO workarounds)
* Respects _all_ of the configuration environmental variables that the javascript aws-sdk v2 supports (e.g. `AWS_SHARED_CREDENTIALS_FILE` / `AWS_SDK_LOAD_CONFIG`)


It is designed to be a drop-in replacement; respecting the current credentials resolution order and custom extensions already provided by the Serverless Framework.

## Usage

1. Install

```bash
npm install --dev serverless-better-credentials
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

## Credential Resolution

Credentials are resolved in the same order the serverless framework currently uses. This order is:

 * from **profile**: cli flag `--aws-profile`
 * from **profile**: env `AWS_${STAGE}_PROFILE`
 * from **env** - `AWS_${STAGE}_X`
 * from **profile** - `AWS_PROFILE`
 * from **env** - `AWS_X`
 * from **profile** - serverless.yml > `provider.profile` (unless --aws-profile is specified)
 * from **config** - serverless.yml > `provider.credentials`
 * from **profile** - `AWS_DEFAULT_PROFILE` || `default`

Where:
 * **profile** credentials attempt to first resolve as [SharedIniFileCredentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SharedIniFileCredentials.html) and then [ProcessCredentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ProcessCredentials.html) (i.e. from AWS CLI config files)
 * **env** credentials resolves as [EnvironmentCredentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EnvironmentCredentials.html) (i.e. from the running process environment)
 * **config** credentials resolve directly as [Credentials](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html) (i.e. from an explicitly set key id and secret)

## Help and Support

If you have an issue, suggestion, or want to contribute, please open an issue or create a pull request and I'll take a look.
