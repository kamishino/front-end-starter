const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const { merge } = require("webpack-merge");
const paths = require("./paths");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "production",
  devtool: false,
  output: {
    path: paths.build,
    publicPath: "./",
    filename: "js/[name].bundle.js",
  },

  module: {
    rules: [
      {
        test: /\.(sass|scss|css)$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              importLoaders: 2,
              sourceMap: false,
              modules: false,
            },
          },
          "postcss-loader",
          "sass-loader",
        ],
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: "styles/[name].min.css",
      chunkFilename: "[id].css",
    }),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      "...",
      new CssMinimizerPlugin({
        parallel: true,
      }), 
      
    ],
    runtimeChunk: {
      name: "runtime",
    },
  },

  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
});
