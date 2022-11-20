/* eslint-env jest, es2020 */

global.m = <T extends Fn>(
  f: T) => f as unknown as jest.MockInstance<ReturnType<T>, Parameters<T>>;
global.mc = <T extends Ctor>(
  c: T) => c as unknown as jest.MockInstance<T, ConstructorParameters<T>>;
