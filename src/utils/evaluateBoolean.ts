/**
 * Evaluates a string or boolean value to a boolean.
 * Particularly useful for parsing config options.
 */
export default function evaluateBoolean(
  value: string | boolean | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error(`serverless-better-credentials: Unrecognized boolean: "${value}". Please use "true" or "false".`);
}
