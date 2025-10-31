// jest.config.ts
import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json';

const config: Config = {
  testEnvironment: 'node',
  // load env **before** we import the app anywhere
  setupFiles: ['<rootDir>/test/setupEnv.ts'],
  // do DB connect/close, expose supertest api, set timeout
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  clearMocks: true,
  restoreMocks: true,

  // modern ts-jest config (no deprecated globals)
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
        isolatedModules: true,
      },
    ],
  },

  moduleNameMapper: pathsToModuleNameMapper(
    tsconfig.compilerOptions.paths ?? {},
    { prefix: '<rootDir>/' },
  ),
};

export default config;
