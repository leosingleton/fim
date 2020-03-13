const path = require('path');
const glob = require('glob');

const config = {
  entry: glob.sync('./src/**/__tests__/**/*.@(test|web).ts'),
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
  output: {
    path: path.resolve(__dirname, 'build/test'),
    filename: 'test.js',
    library: 'library'
  }
};

module.exports = config;