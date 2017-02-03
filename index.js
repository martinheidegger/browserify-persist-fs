const fs = require('fs')
const readFile = fs.readFile
const writeFile = fs.writeFile
const crypto = require('crypto')
const path = require('path')
const hrtime = process.hrtime

function sha (input) {
  return crypto.createHash('sha1').update(input).digest('hex')
}

function msSince (time) {
  var diff = hrtime(time)
  return (diff[0] * 1e9 + diff[1]) * 0.000001
}

module.exports = function (folder, hash, log, disable) {
  if (disable) {
    if (!log) {
      return null
    }
    return function (file, id, package, fallback, cb) {
      var start = hrtime()
      var readTime
      var generateTime
      var doLog = function (err) {
        log({
          file: file,
          cacheFile: undefined,
          err: err,
          cached: false,
          durations: {
            read: readTime || 0,
            cache: 0,
            generate: generateTime || 0,
            total: msSince(start)
          }
        })
      }
      readFile(file, 'utf8', function (err, fileData) {
        readTime = msSince(start)
        if (err) {
          doLog(err)
          return cb(err)
        }
        var generateStart = hrtime()
        fallback(fileData, function (err, data) {
          generateTime = msSince(generateStart)
          doLog(err)
          cb(err, data)
        })
      })
    }
  }
  const cacheFolder = path.join(folder, sha(JSON.stringify(hash)))
  require('mkdirp').sync(cacheFolder)
  var handler = function (file, id, package, fallback, cb) {
    var start = hrtime()
    var readTime
    var cacheReadTime
    var generateTime
    var cacheFile
    var fileSize
    var generatedSize
    var doLog = log && function (err, cached) {
      log({
        file: file,
        cacheFile: cacheFile,
        err: err,
        cached: cached,
        sizes: {
          input: fileSize,
          output: 
        },
        durations: {
          read: readTime || undefined,
          cache: cacheReadTime || undefined,   
          generate: generateTime || undefined,
          total: msSince(start)
        }
      })
    }
    readFile(file, 'utf8', function (err, fileData) {
      fileSize = fileData.length
      doLog && readTime = msSince(start)
      if (err) {
        doLog && doLog(err, false)
        return cb(err)
      }
      var fileHash = sha(fileData)
      var cacheStart = hrtime()
      cacheFile = path.join(cacheFolder, fileHash + '.json')
      return readFile(cacheFile, 'utf8', function (err, rawCacheData) {
        // ignore error
        doLog && cacheReadTime = msSince(cacheStart)
        if (!rawCacheData) {
          var generateStart = hrtime()
          return fallback(fileData, function (err, data) {
            doLog && generateTime = msSince(generateStart)
            doLog && data && 
            doLog && doLog(err, false)
            if (err) {
              return cb(err)
            }
            writeFile(cacheFile, JSON.stringify(data, null, 2), function () {
              // Don't wait, don't care
            })
            cb(null, data)
          })
        }
        var cacheData = JSON.parse(rawCacheData)
        doLog && doLog(null, true)
        cb(null, cacheData)
      })
    })
  }
  return handler
}

const fs = require('fs')
const readFile = fs.readFile
const writeFile = fs.writeFile
const crypto = require('crypto')
const path = require('path')
const hrtime = process.hrtime

function sha (input) {
  return crypto.createHash('sha1').update(input).digest('hex')
}

function msSince (time) {
  var diff = hrtime(time)
  return (diff[0] * 1e9 + diff[1]) * 0.000001
}

module.exports = function (folder, hash, log, disable) {
  if (disable) {
    if (!log) {
      return null
    }
    return function (file, id, package, fallback, cb) {
      var start = hrtime()
      var readTime
      var generateTime
      var doLog = function (err) {
        log({
          file: file,
          cacheFile: undefined,
          err: err,
          cached: false,
          durations: {
            read: readTime || 0,
            cache: 0,
            generate: generateTime || 0,
            total: msSince(start)
          }
        })
      }
      readFile(file, 'utf8', function (err, fileData) {
        readTime = msSince(start)
        if (err) {
          doLog(err)
          return cb(err)
        }
        var generateStart = hrtime()
        fallback(fileData, function (err, data) {
          generateTime = msSince(generateStart)
          doLog(err)
          cb(err, data)
        })
      })
    }
  }
  const cacheFolder = path.join(folder, sha(JSON.stringify(hash)))
  require('mkdirp').sync(cacheFolder)
  var handler = function (file, id, package, fallback, cb) {
    var start = hrtime()
    var readTime
    var cacheReadTime
    var generateTime
    var cacheFile
    var fileSize
    var generatedSize
    var doLog = log && function (err, cached) {
      log({
        file: file,
        cacheFile: cacheFile,
        err: err,
        cached: cached,
        sizes: {
          input: fileSize,
          output: 
        },
        durations: {
          read: readTime || undefined,
          cache: cacheReadTime || undefined,   
          generate: generateTime || undefined,
          total: msSince(start)
        }
      })
    }
    readFile(file, 'utf8', function (err, fileData) {
      fileSize = fileData.length
      doLog && readTime = msSince(start)
      if (err) {
        doLog && doLog(err, false)
        return cb(err)
      }
      var fileHash = sha(fileData)
      var cacheStart = hrtime()
      cacheFile = path.join(cacheFolder, fileHash + '.json')
      return readFile(cacheFile, 'utf8', function (err, rawCacheData) {
        // ignore error
        doLog && cacheReadTime = msSince(cacheStart)
        if (!rawCacheData) {
          var generateStart = hrtime()
          return fallback(fileData, function (err, data) {
            doLog && generateTime = msSince(generateStart)
            doLog && data && 
            doLog && doLog(err, false)
            if (err) {
              return cb(err)
            }
            writeFile(cacheFile, JSON.stringify(data, null, 2), function () {
              // Don't wait, don't care
            })
            cb(null, data)
          })
        }
        var cacheData = JSON.parse(rawCacheData)
        doLog && doLog(null, true)
        cb(null, cacheData)
      })
    })
  }
  return handler
}
