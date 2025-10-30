import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import tsconfig from './tsconfig.json';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // use the same tsconfig (has baseUrl/paths + jest types)
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
      isolatedModules: true,
    },
  },
  moduleNameMapper: pathsToModuleNameMapper(
    tsconfig.compilerOptions.paths ?? {},
    { prefix: '<rootDir>/' },
  ),
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  // keep tests fast/stable
  clearMocks: true,
  restoreMocks: true,
};

export default config;
