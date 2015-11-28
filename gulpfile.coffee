gulp = require "gulp"
gutil = require "gulp-util"
cache = require "gulp-cached"
changed = require "gulp-changed"
rename = require "gulp-rename"
serve = require "gulp-serve"
stylus = require "gulp-stylus"

babel = require "gulp-babel"
plumber = require "gulp-plumber"
watch = require "gulp-watch"
notify = require "gulp-notify"
runSequence = require "run-sequence"


src =
  build: "./src/*.js"
  examples: "./examples/**/*.es6"
  stylus: "./examples/**/*.styl"

dest =
  build: "./dist"
  examples: "./examples/"
  stylus: "./examples/"

gulp.task "build", ["babel", "stylus"]
gulp.task "default", ["build", "watch", "serve"]

gulp.task "stylus", ->
  gulp.src src.stylus
  .pipe plumber(
    errorHandler: notify.onError(
      "Stylus build error: <%= error.name %> <%= error.message %>"
    )
  )
  .pipe cache "stylus"
  .pipe stylus()
  .pipe rename (path) ->
    path.extname = ".css"
  .pipe gulp.dest dest.stylus


doBabel = (src, dest, renameCallback = ()->) ->
  gulp.src src
  .pipe plumber(
    errorHandler: notify.onError(
      "Babel build error: <%= error.name %> <%= error.message %>"
    )
  )
  .pipe cache "babel"
  .pipe changed dest, extension: ".js"

  .pipe babel
    modules: "amd"
  .on "error", (error) ->
    @hadError = true
    gutil.log(
      gutil.colors.red(
        "#{error.name}: #{error.message} (#{error.fileName})"
      )
    )
  .pipe rename renameCallback
  .pipe gulp.dest dest

gulp.task "babel", ->
  doBabel src.build, dest.build
  doBabel src.examples, dest.examples, (path) ->
    path.extname = ".js"

gulp.task "watch", ["build"], ->
  watch [src.build, src.examples], ->
    runSequence "babel"
  watch [src.stylus], ->
    runSequence "stylus"
  gutil.log "Watcher started"

gulp.task "serve", serve "./"
