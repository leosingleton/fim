// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

const path = require('path');
const glob = require('glob');

module.exports = {
  mode: 'development',
  entry: glob.sync('./**/__tests__/**/*.@(browser|test).ts', { ignore: './**/node_modules/**' }),
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
          configFile: path.resolve(__dirname, 'tsconfig.karma.json'),

          // Do not output .d.ts files. I'm not sure why, but ts-loader was always emitting them next to the source
          // files, not in the build output directory. They don't serve any purpose for the karma unit tests, so turning
          // them off completely here...
          compilerOptions: {
            declaration: false
          }
        }
      }
    ]
  },
  resolve: {
    extensions: [ '.js', '.ts' ]
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'browser-tests.js',
    libraryTarget: 'umd'
  }
};
