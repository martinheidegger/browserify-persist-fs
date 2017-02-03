const tap = require('tap')
const Promise = require('bluebird')
const test = tap.test
const brfypersist = require('../')
const tmp = require('os-tmpdir')
const path = require('path')
const tmpSource = tmp()
const tmpTarget = tmp()
const fs = require('fs')

function createFile (name, data) {
  var file = path.join(tmpSource, name)
  fs.writeFileSync(file, data)
  return file
}

function throwIfCalled (errorMessage) {
  return function () {
    throw new Error(errorMessage)
  }
}

function processFile (source, cb) {
  cb(null, {
    source: source + 'abcd',
    deps: ['fancy', 'button'],
    pkg: {}
  })
}

function processError (source, cb) {
  cb('some-error')
}

const nonExistent = path.join(tmpSource, 'non_existent.js')
const fileA = createFile('a.js', 'Hello World')
const fileB = createFile('b.js', 'Foo')
const fileC = createFile('c.js', 'Error')

function testLog (t, persist, log, isLogOnly) {
  return Promise.all([
    persist(nonExistent, null, null, throwIfCalled('Shouldnt try to fallback on non-existent file'))
      .catch(function () {
        // not important for this test
      }),
    persist(fileA, null, null, processFile),
    persist(fileB, null, null, processFile),
    persist(fileC, null, null, processError)
      .catch(function () {
        // not important for this test
      })
  ]).then(function () {
    return persist(fileA, null, null, isLogOnly ? processFile : throwIfCalled('It Should be already cached!'))
  }).then(function () {
    log = log.sort(function (a, b) {
      return a.file > b.file ? 1 : -1
    })
    var files = log.reduce(function (files, entry) {
      var arr = files[entry.file]
      if (!arr) {
        arr = []
        files[entry.file] = arr
      }
      arr.push(entry)
      return files
    }, {})

    t.equals(files[nonExistent].length, 1)
    t.notSame(files[nonExistent][0].err, null, 'passing through of the error to the log')
    t.same(files[nonExistent][0].cacheFile, null, 'If reading of a file throws an error, the cacheFile can not be evaluated')
    t.same(files[nonExistent][0].durations.cache, null)
    t.same(files[nonExistent][0].durations.generate, null)
    t.type(files[nonExistent][0].durations.total, 'number')
    t.type(files[nonExistent][0].durations.read, 'number')

    t.equals(files[fileA].length, 2)
    t.equals(files[fileA][0].cached, false)
    t.type(files[fileA][0].durations.cache, isLogOnly ? 'undefined' : 'number')
    t.type(files[fileA][0].durations.generate, 'number')
    t.equals(files[fileA][0].sizes.input, 11)
    t.equals(files[fileA][0].sizes.output, 15)

    if (isLogOnly) {
      t.equals(files[fileA][1].cached, false, 'When its cached a cached flag should be set')
      t.same(files[fileA][1].durations.cache, null, 'No caching means no cache number')
      t.type(files[fileA][1].durations.generate, 'number', 'Generate may not be called when it is cached')
    } else {
      t.equals(files[fileA][1].cached, true, 'When its cached a cached flag should be set')
      t.type(files[fileA][1].durations.cache, 'number', 'Cache needs to be recorded when loading from cache')
      t.same(files[fileA][1].durations.generate, null, 'Generate may not be called when it is cached')
    }

    t.equals(files[fileB].length, 1)
    t.equals(files[fileB][0].sizes.input, 3)
    t.equals(files[fileB][0].sizes.output, 7)

    t.equals(files[fileC].length, 1)
    t.same(files[fileC][0].err, 'some-error')
    t.end()
  })
}

test('logging with cache enabled', function (t) {
  var log = []
  var persist = Promise.promisify(brfypersist(tmpTarget, {}, function (logInfo) {
    log.push(logInfo)
  }, false))
  return testLog(t, persist, log, false)
})

test('logging with cache disabled', function (t) {
  var log = []
  var persist = Promise.promisify(brfypersist(tmpTarget, {}, function (logInfo) {
    log.push(logInfo)
  }, true))
  return testLog(t, persist, log, true)
})
