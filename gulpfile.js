// General
const { gulp, parallel, series, src, dest, watch } = require("gulp");
const del = require("del");
const plumber = require("gulp-plumber");
const filter = require("gulp-filter");
const rename = require("gulp-rename");
const newer = require("gulp-newer");

// Image
const imagemin = require("gulp-imagemin");

// Styles
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const minify = require("cssnano");
const cssorder = require("css-declaration-sorter");
const pxtorem = require("postcss-pxtorem");
const postcssPresetEnv = require("postcss-preset-env");

// Scripts
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");

// BrowserSync
const browserSync = require("browser-sync").create();

// Paths
const paths = {
  input: "./src/",
  output: "./dist/",
  html: {
    srcDir: "./src/**/*.html",
    destDir: "./dist/",
  },
  images: {
    srcDir: "./src/images/**/*.{png,jpg,jpeg,gif,ico,svg}",
    destDir: "./dist/images/",
  },
  styles: {
    srcDir: "./src/scss/**/*.{scss,sass}",
    destDir: "./dist/css/",
  },
  scripts: {
    srcDir: "./src/js",
    tmpDir: "./tmp",
    destDir: "./dist/js",
  },
  reload: "./dist/",
};

const jsConfig = require("./src/js/config");

// Template for banner to add to file headers
const banner = {
  full:
    "/*!\n" +
    " * <%= package.name %> v<%= package.version %>\n" +
    " * <%= package.description %>\n" +
    " * (c) " +
    new Date().getFullYear() +
    " <%= package.author.name %>\n" +
    " * <%= package.license %> License\n" +
    " * <%= package.repository.url %>\n" +
    " */\n\n",
  min:
    "/*!" +
    " <%= package.name %> v<%= package.version %>" +
    " | (c) " +
    new Date().getFullYear() +
    " <%= package.author.name %>" +
    " | <%= package.license %> License" +
    " | <%= package.repository.url %>" +
    " */\n",
};

function copyHTML() {
  return src(paths.html.srcDir).pipe(dest(paths.html.destDir));
}

function copyImages() {
  return src(paths.images.srcDir)
    .pipe(plumber())
    .pipe(newer(paths.images.destDir))
    .pipe(imagemin())
    .pipe(dest(paths.images.destDir));
}

// PostCSS Processors
const styleProcessors = [
  cssorder({ order: "smacss" }),
  pxtorem({
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
  autoprefixer({
    browsersList: ["> 1%", "last 2 versions", "IE 11"],
  }),
  postcssPresetEnv(),
];

function styleBuild() {
  return src(paths.styles.srcDir)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss(styleProcessors))
    .pipe(sourcemaps.write("./"))
    .pipe(dest(paths.styles.destDir))
    .pipe(filter("**/*.css"))
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(
      postcss([
        minify({
          discardComments: {
            removeAll: true,
          },
        }),
      ])
    )
    .pipe(sourcemaps.write("./"))
    .pipe(dest(paths.styles.destDir));
}

function jsDeps(done) {
  const tasks = jsConfig.map((config) => {
    return (done) => {
      const deps = (config.deps || []).map((f) => {
        if (f[0] == "~") {
          return `./node_modules/${f.slice(1, f.length)}.js`;
        } else {
          return `${paths.scripts.srcDir}/${f}.js`;
        }
      });
      if (deps.length == 0) {
        done();
        return;
      }
      return src(deps)
        .pipe(concat(`${config.name}.deps.js`))
        .pipe(dest(paths.scripts.tmpDir));
    };
  });

  return series(...tasks, (seriesDone) => {
    seriesDone();
    done();
  })();
}

function jsBuild(done) {
  const tasks = jsConfig.map((config) => {
    return (done) => {
      const files = (config.files || []).map((f) => `${paths.scripts.srcDir}/${f}.js`);
      if (files.length == 0) {
        done();
        return;
      }
      return src(files)
        .pipe(plumber())
        .pipe(concat(`${config.name}.build.js`))
        .pipe(
          babel({
            presets: [
              [
                "@babel/env",
                {
                  modules: "auto",
                },
              ],
            ],
          })
        )
        .pipe(dest(paths.scripts.tmpDir));
    };
  });

  return series(...tasks, (seriesDone) => {
    seriesDone();
    done();
  })();
}

function jsConcat(done) {
  const tasks = jsConfig.map((config) => {
    return () => {
      const files = [
        `${paths.scripts.tmpDir}/${config.name}.deps.js`,
        `${paths.scripts.tmpDir}/${config.name}.build.js`,
      ];

      return src(files, { allowEmpty: true })
        .pipe(plumber())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(concat(`${config.name}.js`))
        .pipe(sourcemaps.write("./"))
        .pipe(dest(paths.scripts.destDir))
        .pipe(filter("**/*.js"))
        .pipe(uglify())
        .pipe(
          rename({
            suffix: ".min",
          })
        )
        .pipe(sourcemaps.write("./"))
        .pipe(dest(paths.scripts.destDir));
    };
  });

  return series(...tasks, (seriesDone) => {
    seriesDone();
    done();
  })();
}

function jsClean(done) {
  del(paths.scripts.tmpDir);
  done();
}

function outputClean(done) {
  del(paths.output);
  done();
}

function browserSyncReload(done) {
  browserSync.reload();
  done();
}

function browserSyncServe(done) {
  browserSync.init({
    server: {
      baseDir: paths.reload,
    },
  });
  done();
}

function watchSource() {
  watch(paths.scripts.srcDir, series(exports.jsBuild, browserSyncReload));
  watch(paths.styles.srcDir, series(styleBuild, browserSyncReload));
  watch(paths.html.srcDir, series(copyHTML, browserSyncReload));
}

exports.outputClean = series(outputClean);
exports.copyAssets = parallel(copyHTML, copyImages);
exports.styleBuild = series(styleBuild);
exports.jsBuild = series(parallel(jsDeps, jsBuild), jsConcat, jsClean);
exports.default = parallel(exports.jsBuild, styleBuild, exports.copyAssets);
exports.watch = series(exports.default, browserSyncServe, watchSource);
