const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  return {
    mode: 'development',
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
          from: '**/*'
        },
        {
          context: './node_modules/bootstrap/dist/css/',
          from: 'bootstrap.min.css',
          to: 'assets/css/'
        }
      ])
    ],
    output: {
      path: path.resolve(__dirname, `build/${argv.mode}/`),
      filename: 'assets/js/sandbox.js',
      library: 'Sandbox'
    }
  };
};
