module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/'],
  testMatch: ['**/__tests__/**/*.(test|node).ts'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'build/',
      outputName: './results-node.xml',
    }]
  ],
  collectCoverage: false, // The CLI has no way to disable. Instead, we must explicitly enable on the command line.
  coverageDirectory: 'build/coverage/node/',
  coverageReporters: ['html', 'text', 'cobertura']
};