/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest to handle TS/TSX
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'ts-jest',
      {
        // 👇 Use a Jest-specific tsconfig (CommonJS)
        tsconfig: '<rootDir>/tsconfig.jest.json',
        useESM: false,
      },
    ],
  },

  testEnvironment: 'jsdom',

  roots: ['<rootDir>/src'],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.ts',
  },

  // 🔒 Global coverage thresholds
  coverageThreshold: {
    global: {
      statements: 65,
      branches: 50,
      functions: 60,
      lines: 65,
    },
  },
};
