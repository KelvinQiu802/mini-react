const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/main.tsx',
  mode: 'development',
  devtool: false,
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
  },
  devServer: {
    static: path.join(__dirname, 'dist'),
    port: 9000,
  },
  externals: {
    react: 'React',
  },
  module: {
    rules: [
      {
        test: /\.tsx$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
};
