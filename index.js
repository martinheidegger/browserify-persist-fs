const fs = require('fs')
const readFile = fs.readFile
const writeFile = fs.writeFile
const crypto = require('crypto')
const path = require('path')
const hrtime = process.hrtime

function createHash (input) {
  return crypto.createHash('sha1').update(input).digest('hex')
}

function msSince (time) {
  var diff = hrtime(time)
  return (diff[0] * 1e9 + diff[1]) * 0.000001
}

function disabledLog (log, file, id, pkg, fallback, cb) {
  var start = hrtime()
  var readTime
  var generateTime
  var inputSize
  var outputSize
  var doLog = function (err) {
    log({
      file: file,
      cacheFile: undefined,
      err: err,
      cached: false,
      durations: {
        read: readTime,
        cache: undefined,
        generate: generateTime,
        total: msSince(start)
      },
      sizes: {
        input: inputSize,
        output: outputSize
      }
    })
  }
  readFile(file, 'utf8', function (err, fileData) {
    inputSize = fileData && fileData.length
    readTime = msSince(start)
    if (err) {
      doLog(err)
      return cb(err)
    }
    var generateStart = hrtime()
    fallback(fileData, function (err, data) {
      outputSize = data && data.source.length
      generateTime = msSince(generateStart)
      doLog(err)
      cb(err, data)
    })
  })
}

module.exports = function (folder, hash, log, disable) {
  if (disable) {
    if (!log) {
      return null
    }
    return disabledLog.bind(null, log)
  }
  const cacheFolder = path.join(folder, createHash(JSON.stringify(hash)))
  require('mkdirp').sync(cacheFolder)
  var handler = function (file, id, pkg, fallback, cb) {
    var start = hrtime()
    var readTime
    var cacheReadTime
    var generateTime
    var cacheFile
    var fileSize
    var generatedSize
    var doLog
    if (log) {
      doLog = function (err, cached) {
        log({
          file: file,
          cacheFile: cacheFile,
          err: err,
          cached: cached,
          sizes: {
            input: fileSize,
            output: generatedSize
          },
          durations: {
            read: readTime || undefined,
            cache: cacheReadTime || undefined,
            generate: generateTime || undefined,
            total: msSince(start)
          }
        })
      }
    }
    readFile(file, 'utf8', function (err, fileData) {
      if (doLog) {
        readTime = msSince(start)
        if (fileData) fileSize = fileData.length
      }
      if (err) {
        if (doLog) doLog(err, false)
        return cb(err)
      }
      var fileHash = createHash(fileData)
      var cacheStart = hrtime()
      cacheFile = path.join(cacheFolder, fileHash + '.json')
      return readFile(cacheFile, 'utf8', function (_err, rawCacheData) {
        // ignore error
        if (doLog) cacheReadTime = msSince(cacheStart)
        if (!rawCacheData) {
          var generateStart = hrtime()
          return fallback(fileData, function (err, data) {
            if (doLog) {
              generateTime = msSince(generateStart)
              if (data) {
                generatedSize = data.source.length
              }
              doLog(err, false)
            }
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
        generatedSize = cacheData.source.length
        doLog && doLog(null, true)
        cb(null, cacheData)
      })
    })
  }
  return handler
}
