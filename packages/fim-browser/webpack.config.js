// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

const path = require('path');

module.exports = (env, argv) => {
  const prod = argv.mode === 'production';

  return {
    entry: './src/index.ts',
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
      extensions: [ '.js', '.ts' ]
    },
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: prod ? 'umd/fim-browser.min.js' : 'umd/fim-browser.js',
      libraryTarget: 'umd'
    }
  };
};
