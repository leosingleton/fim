// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
    plugins: [
      new CopyWebpackPlugin([
        {
          from: '../../samples',
          to: './'
        }
      ]),
      new webpack.ProvidePlugin({
        $: 'jquery'
      })
    ],
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: prod ? 'index.min.js' : 'index.js',
      libraryTarget: 'umd'
    }
  };
};
