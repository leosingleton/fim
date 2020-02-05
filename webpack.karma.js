const path = require('path');
const glob = require('glob');

const config = {
  entry: glob.sync('./**/__tests__/**/*.@(browser|test).ts'),
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [ '.ts' ]
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'browser-tests.js',
    library: 'library'
  }
};

module.exports = config;
