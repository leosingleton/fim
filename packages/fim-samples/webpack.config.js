// FIM - Fast Image Manipulation Library for Javascript
// Copyright (c) Leo C. Singleton IV <leo@leosingleton.com>
// See LICENSE in the project root for license information.

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const prod = argv.mode === 'production';

  return [
    buildWebpackConfig('samples', prod),
    buildWebpackConfig('webgl-sandbox', prod)
  ];
};

function buildWebpackConfig(project, prod) {
  const copyConfig = {
    patterns: [
      {
        context: `../../${project}`,
        from: '**',
        to: project,

        // When building locally, transform the CDN-hosted paths to local paths
        transform(content, _path) {
          return content.toString().replace(/https.+fim-samples\/build/g, '..');
        }
      }
    ]
  };

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
      extensions: [ '.glsl', '.js', '.ts' ]
    },
    plugins: [
      new CopyWebpackPlugin(copyConfig)
    ],
    externals: {
      //bootstrap: 'bootstrap',
      jquery: '$'
    },
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: project + (prod ? '.min.js' : '.js'),
      libraryTarget: 'umd'
    }
  };
}
