// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

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
