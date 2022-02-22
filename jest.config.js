const config = {
  clearMocks: true,
  errorOnDeprecated: true,
  testMatch: ['**/__tests__/**/*.test.(js|ts)'],
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/scratch/',
    '/__tests__/resources/',
  ],
  moduleFileExtensions: ['js', 'ts', 'json'],
  transform: {
    '^.+\\.(j|t)s$': 'ts-jest',
  },
  setupFilesAfterEnv: ['jest-extended', './resources/jest-transforms/jest-extended.ts', './resources/jest-transforms/jest.m.ts'],
};

module.exports = config;
