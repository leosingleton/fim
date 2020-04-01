// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages/'],
  testMatch: ['**/__tests__/**/*.(test|node).ts'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'build/',
      outputName: './results-node.xml',
    }]
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    '**/packages/fim/**/*.ts',
    '**/packages/fim-node/**/*.ts',
    '!**/__tests__/**',
    '!**/build/**'
  ],
  coverageDirectory: 'build/',
  coverageReporters: ['cobertura', 'text'],
  moduleNameMapper: {
    // Redirect the compiled NPM package back to the original TypeScript source for accurate code coverage
    '^@leosingleton/fim$': '<rootDir>/packages/fim/src/index.ts',
    '^@leosingleton/fim/internals$': '<rootDir>/packages/fim/src/internal/index.ts'
  }
};
