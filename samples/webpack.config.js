const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

var config = {
  entry: './src/index.ts',
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
    extensions: [ '.glsl', '.ts' ]
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        context: './static/',
        from: '**/*',
        to: './'
      }
    ])
  ],
  output: {
    path: path.resolve(__dirname, '../build/samples'),
    filename: 'samples.js'
  }
};

module.exports = config;
