const path = require('path');
const glob = require('glob');

const config = {
  entry: glob.sync('./**/__tests__/**/*.@(browser|test).ts'),
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          // ts-loader has an issue where it reads the tsconfig.json file for the first .ts file it encounters and
          // doesn't look for different tsconfig.json files for other files. This causes an issue for FIM as each NPM
          // package has a different rootDir, so unit tests from more than one package will fail to compile. To work
          // around this, we force ts-loader to use the shared configuration file at the root of the repo.
          // See https://github.com/TypeStrong/ts-loader/issues/647
          configFile: path.resolve(__dirname, 'tsconfig.json')
        }
      }
    ]
  },
  resolve: {
    extensions: [ '.ts' ]
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'browser-tests.js'
  }
};

module.exports = config;
