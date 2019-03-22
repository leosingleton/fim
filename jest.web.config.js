module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src/'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'build/',
      outputName: './results-web.xml',
    }]
  ],
  collectCoverage: true,
  coverageDirectory: 'build/coverage/web/'
};