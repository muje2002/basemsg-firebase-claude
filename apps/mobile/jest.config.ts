import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@basemsg/shared$': '<rootDir>/../../packages/shared/src/index',
    '^react-native$': '<rootDir>/__mocks__/react-native.ts',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.ts',
    '^expo-secure-store$': '<rootDir>/__mocks__/expo-secure-store.ts',
    '^@sentry/react-native$': '<rootDir>/__mocks__/@sentry/react-native.ts',
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};

export default config;
