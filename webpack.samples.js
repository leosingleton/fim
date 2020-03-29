// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const config = {
  mode: 'development',
  entry: './packages/fim-samples/src/index.ts',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.glsl$/,
        use: 'webpack-glsl-minify'
      }
    ]
  },
  resolve: {
    extensions: [ '.glsl', '.js', '.ts' ],
    symlinks: false
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        context: './samples/',
        from: '**/*',
        to: './'
      }
    ]),
    new webpack.ProvidePlugin({
      $: 'jquery'
    })
  ],
  output: {
    path: path.resolve(__dirname, './build/samples'),
    filename: 'samples.js',
    libraryTarget: 'window'
  }
};

module.exports = config;
