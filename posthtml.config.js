module.exports = ({ file, options, env }) => ({
  plugins: [
    require("posthtml-attrs-sorter")({
      order: [
        "class",
        "id",
        "name",
        "data-.+",
        "ng-.+",
        "src",
        "for",
        "type",
        "href",
        "values",
        "title",
        "alt",
        "role",
        "aria-.+",
        "$unknown$",
      ],
    }),
  ],
});
