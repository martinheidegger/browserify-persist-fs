const fs = require('fs')
const readFile = fs.readFile
const writeFile = fs.writeFile
const crypto = require('crypto')
const path = require('path')
const hrtime = process.hrtime
const after = require('after')
const xtend = require('xtend')

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

function asyncMap (input, processor, parallel, cb) {
  if (input.length === 0) {
    return cb(null, [])
  }
  var output = []
  parallel = Math.min(parallel, input.length)
  var next = after(parallel, function (err) {
    err ? cb(err) : cb(null, output)
  })
  for (var i = 0; i < parallel; ++i) processOne()
  function processOne () {
    if (input.length === 0) {
      return next()
    }
    processor(input.shift(), function (err, data) {
      if (err) {
        return next(err)
      }
      output.push(data)
      processOne()
    })
  }
}

function getFileStats (folder, file, cb) {
  file = path.join(folder, file)
  fs.stat(file, function (err, stat) {
    err ? cb(err) : cb(null, {
      file: file,
      atime: stat.atime,
      size: stat.size
    })
  })
}

function getFolderStats (folder, parallel, cb) {
  fs.readdir(folder, function (err, files) {
    err ? cb(err) : asyncMap(files, getFileStats.bind(null, folder), parallel, cb)
  })
}

function rmf (file, cb) {
  fs.unlink(file, function () {
    cb() // eat the error
  })
}

function gc (folder, opts, cb) {
  opts = xtend({
    maxCount: Number.MAX_SAFE_INTEGER,
    maxSize: Number.MAX_SAFE_INTEGER,
    maxAge: Number.MAX_SAFE_INTEGER,
    parallel: 5
  }, opts)
  getFolderStats(folder, opts.parallel, function (err, stats) {
    if (err) {
      return cb(err)
    }
    var totalSize = 0
    var filesToDelete = stats.sort(function (a, b) {
      return a.atime > b.atime ? 1 : -1
    }).filter(function (stat, nr) {
      totalSize += stat.size
      var age = Date.now() - stat.atime.getTime()
      return !(
        age < opts.maxAge &&
        totalSize < opts.maxSize &&
        nr < opts.maxCount
      )
    }).map(function (stat) {
      return stat.file
    })
    asyncMap(filesToDelete.concat(), rmf, opts.parallel, function (err) {
      err ? cb(err) : cb(null, filesToDelete)
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
  const cachePrefix = path.join(folder, createHash(JSON.stringify(hash)))
  require('mkdirp').sync(folder)
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
      var fileHash = createHash(file + fileData)
      var cacheStart = hrtime()
      cacheFile = path.join(cachePrefix + '_' + fileHash + '.json')
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
  handler.gc = gc.bind(null, folder)
  return handler
}
