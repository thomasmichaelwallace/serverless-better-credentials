import AWS, { AWSError } from 'aws-sdk';
import readline from 'readline';
import SsoCredentials from '../SsoCredentials';
import { CredentialsOptions } from '../types';

interface ProfileOptions {
  // SharedIniFileCredentialsOptions
  tokenCodeFn?: (mfaSerial: string, callback: (err?: Error, token?: string) => void) => void
  // ProcessCredentialsOptions && SharedIniFileCredentialsOptions
  profile?: string
  filename?: string
}

function isCredentialsOptions(c?: Partial<CredentialsOptions>): c is CredentialsOptions {
  if (!c) return false;
  const hasValidId = typeof c?.accessKeyId === 'string' && c.accessKeyId !== 'undefined';
  const hasValidKey = typeof c?.secretAccessKey === 'string' && c.secretAccessKey !== 'undefined';
  const hasValidToken = typeof c?.sessionToken === 'string' && c.sessionToken !== 'undefined';
  return hasValidId && (hasValidKey || hasValidToken);
}

/*
 * The aws-sdk-js provides a built in mechanism for resolving credentials from multiple sources:
 *  https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html
 * However, the credential resolution for the serverless framework differs significantly from the
 * AWS default provider chain (e.g. credentials and provides set by the yaml).
 *
 * This class allows us to define a more flexible order (see AwsProvider.getCredentials()),
 * while still using the aws-sdk-js supported framework; so we can more readily support future
 * ways of resolving credentials.
 *
 * Until https://github.com/aws/aws-sdk-js/issues/3122 is resolved, extending the
 * AWS.CredentialProviderChain does not result in AWS.Credentials that refresh using the chain.
 * Therefore we must extend AWS.Credentials directly and provide a refresh method that
 * resolves the chain ourselves.
 */
export default class AwsCredentials extends AWS.Credentials {
  chain: AWS.CredentialProviderChain;

  private hint = 'No credentials resolved';

  hintShown = false;

  private logHintFn: (hint: string) => void;

  constructor(hintFn: (hint: string) => void) {
    super('ACCESS_KEY_ID', 'SECRET_ACCESS_KEY');
    this.expired = true; // force refresh based on chain
    this.chain = new AWS.CredentialProviderChain([]); // providers are added explicitly
    this.logHintFn = hintFn;
  }

  refresh(callback: (err?: AWSError) => void) {
    this.chain.resolve((err, res) => {
      if (err) {
        callback(err);
      } else if (!res) {
        const e: AWSError = {
          name: 'CredentialsError',
          message: 'Unable to resolve credentials',
          code: 'CredentialsError',
          time: new Date(),
        };
        callback(e);
      } else {
        AWS.Credentials.call<AWS.Credentials, CredentialsOptions[]>(this, res);
        if (!this.hintShown) {
          this.hintShown = true;
          this.logHintFn(`credentials resolved ${this.hint}`);
        }
        callback();
      }
    });
  }

  addConfig(hint: string, credentials?: Partial<CredentialsOptions>) {
    if (isCredentialsOptions(credentials)) {
      this.chain.providers.push(() => {
        this.hint = `from config: ${hint}`;
        return new AWS.Credentials(credentials);
      });
    }
  }

  addEnvironment(hint: string, prefix?: string) {
    if (prefix) {
      this.chain.providers.push(() => {
        this.hint = `from env: ${hint}`;
        return new AWS.EnvironmentCredentials(prefix);
      });
    }
  }

  addProfile(hint: string, profile?: string) {
    if (profile) {
      const params: ProfileOptions = { profile };
      if (process.env.AWS_SHARED_CREDENTIALS_FILE) {
        params.filename = process.env.AWS_SHARED_CREDENTIALS_FILE;
      }

      // Setup a MFA callback for asking the code from the user.
      params.tokenCodeFn = (mfaSerial, callback) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`Enter MFA code for ${mfaSerial}: `, (answer) => {
          rl.close();
          callback(undefined, answer);
        });
      };

      this.chain.providers.push(() => {
        this.hint = `from config ini profile: ${hint} (${profile})`;
        return new AWS.SharedIniFileCredentials(params);
      });
      this.chain.providers.push(() => {
        this.hint = `from config sso profile: ${hint} (${profile})`;
        return new SsoCredentials(params);
      });
      this.chain.providers.push(() => {
        this.hint = `from config credential process profile: ${hint} (${profile})`;
        return new AWS.ProcessCredentials(params);
      });
    }
  }
}
