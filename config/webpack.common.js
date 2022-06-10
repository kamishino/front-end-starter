const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const { extendDefaultPlugins } = require("svgo");

const paths = require("./paths");

module.exports = {
  entry: [paths.src + "/index.js"],

  output: {
    path: paths.build,
    filename: "[name].bundle.js",
    publicPath: "/",
  },

  plugins: [
    new CleanWebpackPlugin(),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: paths.public,
          to: "assets",
          globOptions: {
            ignore: ["*.DS_Store"],
          },
          noErrorOnMissing: true,
        },
      ],
    }),

    new HtmlWebpackPlugin({
      template: paths.src + "/index.html",
      filename: "index.html",
      inject: true,
    }),
  ],

  module: {
    rules: [
      // JavaScript: Use Babel to transpile JavaScript files
      { test: /\.js$/, use: ["babel-loader"] },

      // HTML: Reload the HTML files
      { test: /\.html$/i, use: ["html-loader"] },

      // Images: Copy image files to build folder
      { test: /\.(?:ico|gif|png|jpg|jpeg)$/i, type: "asset/resource" },

      // Fonts and SVGs: Inline files
      { test: /\.(woff(2)?|eot|ttf|otf|svg|)$/i, type: "asset/inline" },
    ],
  },

  optimization: {
    minimizer: [
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            plugins: [
              ["gifsicle", { interlaced: true }],
              ["jpegtran", { progressive: true }],
              ["optipng", { optimiztionLevel: 5 }],
            ],
          },
        },
      }),
      "...",
    ],
  },

  resolve: {
    modules: [paths.src, "node_modules"],
    extensions: [".js", ".jsx", ".json"],
    alias: {
      "@": paths.src,
      assets: paths.public,
    },
  },
};
