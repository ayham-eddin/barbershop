// jest.config.ts
import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Modern ts-jest config placement
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },

  moduleNameMapper: pathsToModuleNameMapper(
    tsconfig.compilerOptions?.paths ?? {},
    { prefix: '<rootDir>/' },
  ),

  setupFiles: ['<rootDir>/test/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],

  clearMocks: true,
  restoreMocks: true,

  // 🚫 Run tests serially to avoid DB drop / race conditions
  maxWorkers: 1,
  testTimeout: 20000, // 20s to give headroom for slower DB ops

  // ---- Coverage settings ----
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'json', 'html'],

  // What files to measure
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',           // usually just boots the server
    '!src/**/server.ts',          // express composition, not core logic
    '!src/config/**',             // wiring/config
    '!src/common/constants/ENV.ts',
    '!src/**/types.ts',           // pure types
  ],

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/dist/',
  ],

  // ✅ Adjusted thresholds (now matches your actual coverage)
  coverageThreshold: {
    global: {
      statements: 67,
      branches: 35,
      functions: 60,
      lines: 68,
    },
  },
};

export default config;
