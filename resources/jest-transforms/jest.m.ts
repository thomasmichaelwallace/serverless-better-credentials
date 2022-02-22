/* eslint-env jest */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Fn = (...args: any) => any;
type Ctor = new (...args: any) => any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type FnMocker = <T extends Fn>(f: T) => jest.MockInstance<ReturnType<T>, Parameters<T>>;
type CtorMocker = <T extends Ctor>(c: T) => jest.MockInstance<T, ConstructorParameters<T>>;

/* eslint-disable no-var, vars-on-top, @typescript-eslint/no-unused-vars */
declare var m: FnMocker;
declare var mc: CtorMocker;
/* eslint-enable no-var, vars-on-top, @typescript-eslint/no-unused-vars */

globalThis.m = <T extends Fn>(
  f: T) => f as unknown as jest.MockInstance<ReturnType<T>, Parameters<T>>;
globalThis.mc = <T extends Ctor>(
  c: T) => c as unknown as jest.MockInstance<T, ConstructorParameters<T>>;
