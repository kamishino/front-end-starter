const path = require("path");

module.exports = {
  // Source files
  src: path.resolve(__dirname, "../src"),

  // Production build files
  build: path.resolve(__dirname, "../dist"),

  // Pug files collection
  pug: path.resolve(__dirname, "../src/pages"),

  // Static files that get copied to build folder
  public: path.resolve(__dirname, "../public"),
  assets: path.resolve(__dirname, "../public/assets"),
};
