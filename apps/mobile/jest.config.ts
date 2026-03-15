import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@basemsg/shared$': '<rootDir>/../../packages/shared/src/index',
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};

export default config;
