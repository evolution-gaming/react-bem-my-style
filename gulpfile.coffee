gulp = require "gulp"
gutil = require "gulp-util"
cache = require "gulp-cached"
changed = require "gulp-changed"
babel = require "gulp-babel"
plumber = require "gulp-plumber"
watch = require "gulp-watch"
notify = require "gulp-notify"
runSequence = require "run-sequence"


src = "./src/*.js"
dest = "./dist"

gulp.task "build", ["babel"]
gulp.task "default", ["watch"]
gulp.task "babel", ->
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
  .pipe gulp.dest dest

gulp.task "watch", ["build"], ->
  watch src, ->
    runSequence "babel"
  gutil.log "Watcher started"

