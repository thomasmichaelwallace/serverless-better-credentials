import { AWSError } from 'aws-sdk';

export default function isAwsError(e: unknown): e is AWSError {
  if (e === undefined || e === null) return false;
  if (typeof e !== 'object') return false;
  return 'code' in e && 'message' in e;
}
