var through = require('through2')
var gutil = require('gulp-util')
var PluginError = gutil.PluginError
var FastlyPurge = require('fastly-purge')

module.exports = function (options) {
  var fastlyPurge = new FastlyPurge(options.FASTLY_API_KEY)

  var invalidate = function (cb) {
    fastlyPurge.service(options.FASTLY_SERVICE_ID, cb)
  }

  return through.obj(function (file, enc, cb) {
    cb()
  }, invalidate)
}
