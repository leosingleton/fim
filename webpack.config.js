const webpack = require('webpack');
const path = require('path');

var config = {
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
    extensions: [ '.ts' ]
  },
  output: {
    path: path.resolve(__dirname, 'build/dist'),
    filename: 'index.js',
    library: 'library',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: '(typeof self !== "undefined" ? self : this)'
  }
};

module.exports = config;
