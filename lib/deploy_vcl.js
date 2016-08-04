var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var crypto = require('crypto')
var _ = require('lodash')

var getActiveVersionNumber = function (serviceId, apiKey) {
  return Promise
    .resolve()
    .then(function () {
      return request({
        method: 'GET',
        url: 'https://api.fastly.com/service/' + serviceId + '/version',
        headers: {
          'Fastly-Key': apiKey
        },
        json: true
      })
    })
    .then(function (resp) {
      var body = resp.body
      var activeVersion = _.find(body, function (v) {
        return v.active == true
      })
      return activeVersion.number
    })
}

var cloneVersion = function (serviceId, apiKey, versionNumber) {
  return Promise
    .resolve()
    // clones the appropriate version number
    // and returns the new cloned version number
    .then(function () {
      return request({
        method: 'PUT',
        url: 'https://api.fastly.com/service/' + serviceId+ '/version/' + versionNumber + '/clone',
        headers: {
          'Fastly-Key': apiKey
        },
        json: true
      })
    })
    .then(function (resp) {
      var body = resp.body
      return body.number
    })
}

var activateVersion = function (serviceId, apiKey, versionNumber) {
  return request({
    method: 'PUT',
    url: 'https://api.fastly.com/service/' + serviceId + '/version/' + versionNumber + '/activate',
    headers: {
      'Fastly-Key': apiKey
    }
  })
}

var getAllVcls = function (serviceId, apiKey, versionNumber) {
  return request({
    method: 'GET',
    url: 'https://api.fastly.com/service/' + serviceId + '/version/' + versionNumber + '/vcl',
    headers: {
      'Fastly-Key': apiKey
    },
    json: true
  })
  .then(function (resp) {
    return resp.body
  })
}

var getMainVclHash = function (serviceId, apiKey, versionNumber) {
  return Promise
    .resolve()
    .then(function () {
      return getAllVcls(serviceId, apiKey, versionNumber)
    })
    .then(function (body) {
      var mainVcl = _.find(body, function (v) {
        return v.main == true
      })

      return mainVcl.name
    })
}

var persistMainVclFile = function (serviceId, apiKey, versionNumber, vclHash, vclFile) {
  return Promise
    .resolve()
    // add the vcl file
    .then(function () {
      return request({
        method: 'POST',
        url: 'https://api.fastly.com/service/' + serviceId + '/version/' + versionNumber + '/vcl',
        headers: {
          'Fastly-Key': apiKey
        },
        form: {
          name: vclHash,
          content: vclFile
        }
      })
    })
    // make it the main vcl file for versionNumber
    .then(function () {
      return request({
        method: 'PUT',
        url: 'https://api.fastly.com/service/' + serviceId + '/version/' + versionNumber + '/vcl/' + vclHash + '/main',
        headers: {
          'Fastly-Key': apiKey
        }
      })
    })
}

var cleanupNonActiveVcls = function (serviceId, apiKey, versionNumber) {
  return Promise
    .bind({})
    .then(function () {
      return getAllVcls(serviceId, apiKey, versionNumber)
    })
    .then(function (body) {
      return _.map(body, function (v) {
        if (v.main == false) {
          return v.name
        }
      })
    })
    .map(function (vclName) {
      if (!vclName) {
        return
      }

      return request({
        method: 'DELETE',
        url: 'https://api.fastly.com/service/' + serviceId + '/version/' + versionNumber + '/vcl/' + vclName,
        headers: {
          'Fastly-Key': apiKey
        }
      })
    })
}

var cloneVersionWithNewVcl = function (serviceId, apiKey, versionNumber, vclHash, vclFile) {
  return Promise
    .bind({})
    .then(function () {
      return cloneVersion(serviceId, apiKey, versionNumber)
    })
    .then(function (newVersionNumber) {
      this.newVersionNumber = newVersionNumber
    })
    .then(function () {
      return persistMainVclFile(serviceId, apiKey, this.newVersionNumber, vclHash, vclFile)
    })
    .then(function () {
      return cleanupNonActiveVcls(serviceId, apiKey, this.newVersionNumber)
    })
    .then(function (resp) {
      return this.newVersionNumber
    })
}


module.exports = function (serviceId, apiKey, vclFile) {
  return Promise
    .bind({
      serviceId: serviceId,
      apiKey: apiKey,
      vclFile: vclFile,
      vclHash: crypto.createHash('md5').update(vclFile).digest('hex'),
      currentVersionNumber: null
    })
    .then(function () {
      return getActiveVersionNumber(this.serviceId, this.apiKey)
    })
    .then(function (currentVersionNumber) {
      this.currentVersionNumber = currentVersionNumber
    })
    .then(function () {
      return getMainVclHash(this.serviceId, this.apiKey, this.currentVersionNumber)
    })
    .then(function (latestVclHash) {
      if (latestVclHash !== this.vclHash) {
        return cloneVersionWithNewVcl(this.serviceId, this.apiKey, this.currentVersionNumber, this.vclHash, this.vclFile)
      }
    })
    .then(function (newVersionNumber) {
      if (newVersionNumber && newVersionNumber !== this.currentVersionNumber) {
        return activateVersion(this.serviceId, this.apiKey, newVersionNumber)
      }
    })
}
