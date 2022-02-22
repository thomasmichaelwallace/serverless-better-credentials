// @ts-expect-error while https://github.com/jest-community/jest-extended/issues/367
// eslint-disable-next-line import/no-extraneous-dependencies
import * as matchers from 'jest-extended';

expect.extend(matchers as jest.ExpectExtendMap);
