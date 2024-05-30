const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")

const { merge } = require("webpack-merge")
const paths = require("./paths")
const common = require("./webpack.common")

const isOutputExpanded = process.env.SASS_STYLE === "expanded"

module.exports = merge(common, {
  mode: "production",
  devtool: false,
  output: {
    path: paths.build,
    publicPath: "./",
    filename: "js/[name].bundle.js",
    clean: true,
  },

  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
            options: {
              importLoaders: 1,
              sourceMap: false,
              modules: false,
            },
          },
          "postcss-loader",
          {
            loader: "sass-loader",
            options: {
              sourceMap: false,
              sassOptions: {
                outputStyle: isOutputExpanded ? "expanded" : "compressed",
              },
            },
          },
        ],
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: isOutputExpanded ? "styles/[name].css" : "styles/[name].min.css",
      chunkFilename: "[id].css",
    }),
  ],

  optimization: {
    minimize: true,
    minimizer: [
      "...",
      isOutputExpanded
        ? null
        : new CssMinimizerPlugin({
            parallel: true,
          }),
    ],
    runtimeChunk: "single",
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
      },
    },
  },

  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
})
