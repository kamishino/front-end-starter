const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlWebpackPugPlugin = require("html-webpack-pug-plugin");

const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");

const paths = require("./paths");
const fs = require("fs");

// Read all the pug files
let pugTemplates = [];
let pugFiles = fs.readdirSync(paths.pug);

pugFiles.forEach((pugFile) => {
  if (pugFile.match(/\.pug$/)) {
    let pugFileName = pugFile.substring(0, pugFile.length - 4);
    pugTemplates.push(
      new HtmlWebpackPlugin({
        template: `${paths.pug}/${pugFileName}.pug`,
        filename: `${pugFileName}.html`,
        inject: true,
        minify: false,
      })
    );
  }
});

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
          to: "[name][ext]",
          globOptions: {
            ignore: ["**/assets/**"],
          },
        },
        {
          from: paths.assets,
          to: "assets",
          globOptions: {
            ignore: ["*.DS_Store"],
          },
          noErrorOnMissing: true,
        },
      ],
    }),

    ...pugTemplates,
    new HtmlWebpackPugPlugin(),
  ],

  module: {
    rules: [
      // JavaScript: Use Babel to transpile JavaScript files
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  useBuiltIns: "entry",
                  corejs: "3",
                },
              ],
            ],
          },
        },
      },

      // Pug: Render the Pug files to HTML files
      {
        test: /\.pug$/,
        use: [
          "raw-loader",
          {
            loader: "pug-html-loader",
            options: {
              pretty: true,
            },
          },
          {
            loader: "posthtml-loader",
          },
        ],
      },

      // HTML: Reload the HTML files
      {
        test: /\.html$/,
        use: [
          {
            loader: "html-loader",
            options: {
              minimize: false,
            },
          },
          {
            loader: "posthtml-loader",
          },
        ],
      },

      // Images: Copy image files to build folder
      { test: /\.(?:ico|gif|png|jpg|jpeg)$/, type: "asset/resource" },

      // Fonts and SVGs: Inline files
      { test: /\.(woff(2)?|eot|ttf|otf|svg|)$/, type: "asset/inline" },
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
              [
                "svgo",
                {
                  plugins: [
                    {
                      name: "preset-default",
                      params: {
                        overrides: {
                          cleanupAttrs: true,
                          removeDoctype: true,
                          removeXMLProcInst: true,
                          removeComments: true,
                          removeMetadata: true,
                          removeTitle: true,
                          removeDesc: true,
                          removeUselessDefs: true,
                          removeEditorsNSData: true,
                          removeEmptyAttrs: true,
                          removeHiddenElems: true,
                          removeEmptyText: true,
                          removeEmptyContainers: true,
                          removeViewBox: false,
                        },
                      },
                    },
                  ],
                },
              ],
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
      "@style": paths.src + "/styles",
      "@script": paths.src + "/js",
      "@public": paths.public,
    },
  },
};
