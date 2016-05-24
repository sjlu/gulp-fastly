var through = require('through2')
var gutil = require('gulp-util')
var PluginError = gutil.PluginError
var FastlyPurge = require('fastly-purge')

module.exports = function (options) {
  var fastlyPurge = new FastlyPurge(options.apiKey)

  var invalidate = function (cb) {
    fastlyPurge.service(options.serviceId, cb)
  }

  return through.obj(function (file, enc, cb) {
    cb()
  }, invalidate)
}
