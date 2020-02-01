const path = require('path');

const config = {
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
  externals: [
    '@leosingleton/commonlibs'
  ],
  output: {
    path: path.resolve(__dirname, 'build/dist'),
    filename: 'index.js',
    library: 'library',
    libraryTarget: 'commonjs2',
    umdNamedDefine: true,
    globalObject: '(typeof self !== "undefined" ? self : this)'
  }
};

module.exports = config;
