var through = require('through2')
var gutil = require('gulp-util')
var PluginError = gutil.PluginError
var FastlyPurge = require('fastly-purge')
var _ = require('lodash')
var fs = require('fs')
var Promise = require('bluebird')

var deployVcl = require('./lib/deploy_vcl')

function Main (options) {
  this.API_KEY = options.apiKey
  this.SERVICE_ID = options.serviceId
}

Main.prototype.purge = function () {
  var main = this

  var fastlyPurge = new FastlyPurge(main.API_KEY)

  var invalidate = function (cb) {
    fastlyPurge.service(main.SERVICE_ID, cb)
  }

  return through.obj(function (file, enc, cb) {
    cb()
  }, invalidate)
}

Main.prototype.deployVcl = function () {
  var main = this

  return through.obj(function (file, enc, cb) {
    return Promise
      .resolve(deployVcl(main.SERVICE_ID, main.API_KEY, String(file.contents)))
      .nodeify(cb)
  })
}

module.exports = Main
