import evaluateBoolean from '../evaluateBoolean';

describe('evaluateBoolean', () => {
  it('returns boolean when boolean value provided', () => {
    expect(evaluateBoolean(true, false)).toBe(true);
    expect(evaluateBoolean(false, true)).toBe(false);
  });

  it('returns default when undefined value provided', () => {
    expect(evaluateBoolean(undefined, false)).toBe(false);
    expect(evaluateBoolean(undefined, true)).toBe(true);
  });

  it('parses strings into booleans', () => {
    expect(evaluateBoolean('true', false)).toBe(true);
    expect(evaluateBoolean('false', true)).toBe(false);
  });

  it('throws with unrecognized strings', () => {
    expect(() => evaluateBoolean('yes', true))
      .toThrowErrorMatchingInlineSnapshot('"serverless-better-credentials: Unrecognized boolean: "yes". Please use "true" or "false"."');
  });
});
