module.exports = config => {
  config.set({
    files: [
      'build/browser-tests.js'
    ],
    browsers: ['ChromeHeadless'],
    frameworks: ['jasmine'],
    reporters: ['progress', 'junit'],
    junitReporter: {
      outputDir: 'build/',
      outputFile: 'results-browser.xml',
      useBrowserName: false
    },
    singleRun: true
  });
};
