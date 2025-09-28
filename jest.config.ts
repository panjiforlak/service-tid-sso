import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'tests/unit/.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/database/**/*',
    '!src/main.ts',
    '!src/app.service.ts',
    '!src/app.module.ts',
    '!src/app.controller.ts',
    '!src/modules/**/entities/**/*',
    '!src/modules/**/dto/**/*',
    '!src/**/*.module.ts',
    '!src/**/*.swagger.ts',
    '!src/modules/**/*.strategy.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
