// General
const { gulp, parallel, series, src, dest, watch } = require("gulp");
const del = require("del");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");

// Styles
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const minify = require("cssnano");
const cssorder = require("css-declaration-sorter");

// Scripts
const babel = require("gulp-babel");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");

// BrowserSync
const browserSync = require("browser-sync").create();
const reload = browserSync.reload;

// Paths
const paths = {
  input: "./src/",
  output: "./dist/",
  html: {
    srcDir: "./src/**/*.html",
    destDir: "./dist/",
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

const jsConfig = require("./src/config");

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

// The hash is the timestamp when the task runs.
const hash = new Date().getTime();

// PostCSS Processors
const styleProcessors = [
  autoprefixer({
    cascade: true,
    remove: true,
    browsersList: ["> 1%", "last 2 versions", "IE 10"],
  }),
  cssorder({ order: "smacss" }),
];

function copyHTML() {
  return src(paths.html.srcDir).pipe(dest(paths.html.destDir));
}

function styleBuild() {
  return (
    src(paths.styles.srcDir)
      // .pipe(sourcemaps.init())
      .pipe(sass().on("error", sass.logError))
      .pipe(postcss(styleProcessors))
      // .pipe(sourcemaps.write("."))
      .pipe(dest(paths.styles.destDir))
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
      // .pipe(sourcemaps.write("."))
      .pipe(dest(paths.styles.destDir))
  );
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
      return (
        src(files)
          .pipe(plumber())
          .pipe(concat(`${config.name}.build.js`))
          .pipe(
            babel({
              presets: [
                [
                  "@babel/env",
                  {
                    modules: false,
                  },
                ],
              ],
            })
          )
          // .pipe(uglify())
          .pipe(dest(paths.scripts.tmpDir))
      );
    };
  });

  return series(...tasks, (seriesDone) => {
    seriesDone();
    done();
  })();
}

function jsConcat(done) {
  const tasks = jsConfig.map((config) => {
    return (done) => {
      const files = [`${paths.scripts.tmpDir}/${config.name}.deps.js`, `${paths.scripts.tmpDir}/${config.name}.build.js`];
      return (
        src(files, { allowEmpty: true })
          .pipe(plumber())
          // Append hash to the bundle filename.
          .pipe(concat(`${config.name}.js`))
          .pipe(dest(paths.scripts.destDir))
          .pipe(uglify())
          .pipe(
            rename({
              suffix: ".min",
            })
          )
          .pipe(dest(paths.scripts.destDir))
      );
    };
  });

  return series(...tasks, (seriesDone) => {
    seriesDone();
    done();
  })();
}

function jsClean(done) {
  const tasks = jsConfig.map((config) => {
    return (done) => {
      //   const files = [`${paths.scripts.tmpDir}/${config.name}.deps.js`, `${paths.scripts.tmpDir}/${config.name}.build.js`];
      //   return del(files);
      return del(paths.scripts.tmpDir);
    };
  });

  return series(...tasks, (seriesDone) => {
    seriesDone();
    done();
  })();
}

function watchSource() {
  browserSync.init({
    server: {
      baseDir: paths.reload,
    },
  });

  watch(paths.scripts.srcDir, series(jsBuild, reload));
  watch(paths.styles.srcDir, series(styleBuild, reload));
  watch(paths.html.srcDir, series(copyHTML, reload));
}

exports.styleBuild = series(styleBuild);
exports.jsBuild = series(jsDeps, jsBuild, jsConcat);
exports.default = series(exports.jsBuild, jsClean, styleBuild, copyHTML);
exports.watch = series(exports.default, watchSource);
