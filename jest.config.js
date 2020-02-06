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
    '**/packages/*/**/*.js',
    '**/packages/*/**/*.ts',
    '!**/__tests__/**',
    '!**/build/**'
  ],
  coverageDirectory: 'build/',
  coverageReporters: ['cobertura', 'text']
};
