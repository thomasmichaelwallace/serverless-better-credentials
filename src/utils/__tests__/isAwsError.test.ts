import { AWSError } from 'aws-sdk';
import isAwsError from '../isAwsError';

test('returns true if error is shaped like an AWS error', () => {
  const awsError: AWSError = {
    code: 'CredentialsError',
    message: 'Unable to resolve credentials',
    name: 'CredentialsError',
    time: new Date(),
  };
  expect(isAwsError(awsError)).toBe(true);
});

test('returns false if error does not appear to originate from AWS', () => {
  const error = new Error('Something went wrong');
  expect(isAwsError(error)).toBe(false);
});
