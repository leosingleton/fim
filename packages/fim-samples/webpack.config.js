// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const prod = argv.mode === 'production';

  return [
    buildWebpackConfig('samples', prod, false, false),
    buildWebpackConfig('sandbox', prod, true, true)
  ];
};

function buildWebpackConfig(project, prod, includeBootstrap, includeJQuery) {
  const copyConfig = [
    {
      context: `../../${project}`,
      from: '**',
      to: project,

      // When building locally, transform the CDN-hosted paths to local paths
      transform(content, _path) {
        return content.toString().replace(/https.+fim-samples\/build/, '..');
      }
    }
  ];

  if (includeBootstrap) {
    copyConfig.push({
      context: 'node_modules/bootstrap/dist/css/',
      from: 'bootstrap.min.css',
      to: `${project}/assets/css/`
    });
  }

  const provideConfig = {};

  if (!includeJQuery) {
    provideConfig.$ = 'jquery';
  }

  return {
    entry: `./src/${project}/index.ts`,
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
      new CopyWebpackPlugin(copyConfig),
      new webpack.ProvidePlugin(provideConfig)
    ],
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: project + (prod ? '.min.js' : '.js'),
      libraryTarget: 'umd'
    }
  };
}
