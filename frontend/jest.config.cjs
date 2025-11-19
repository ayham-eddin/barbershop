/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',

  roots: ['<rootDir>/src'],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'ts-jest',
      {
        // use the test-specific tsconfig (CommonJS-friendly)
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },

  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.ts',
  },
};
