/* eslint-disable @typescript-eslint/no-explicit-any */
type Fn = (...args: any) => any;
type Ctor = new (...args: any) => any;
/* eslint-enable @typescript-eslint/no-explicit-any */

declare function m <T extends Fn>(f: T): jest.MockInstance<ReturnType<T>, Parameters<T>>;
declare function mc <T extends Ctor>(c: T): jest.MockInstance<T, ConstructorParameters<T>>;
