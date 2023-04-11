module.exports = {
  plugins: [
    require("css-declaration-sorter")({
      order: "smacss",
    }),
    require("postcss-pxtorem")({
      rootValue: 16,
      unitPrecision: 5,
      propList: [
        "padding",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "margin",
        "margin-top",
        "margin-right",
        "margin-bottom",
        "margin-left",
        "font",
        "font-size",
        "line-height",
        "letter-spacing",
      ],
      selectorBlackList: [],
      replace: true,
      mediaQuery: false,
      minPixelValue: 0,
      exclude: "/node_modules/i",
    }),
    require("postcss-preset-env"),
  ],
};
