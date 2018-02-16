const tap = require('tap')
const Promise = require('bluebird')
const test = tap.test
const brfypersist = require('../')
const fs = require('fs')
const path = require('path')
const tmpDir = require('./util/tmpDir')
const mkdirp = require('mkdirp')
const tmpSource = path.join(tmpDir, 'cache_source')
const tmpTarget = path.join(tmpDir, 'cache_target')

mkdirp.sync(tmpSource)

function createFile (name, data) {
  var file = path.join(tmpSource, name)
  fs.writeFileSync(file, data)
  return file
}

function processFile (source, cb) {
  cb(null, {
    source: source + ' // docs',
    deps: ['foo', 'bar'],
    pkg: {
      name: 'baz'
    }
  })
}

function wait (duration) {
  return function () {
    return new Promise(function (resolve) {
      setTimeout(resolve, duration)
    })
  }
}

const fileA = createFile('a.js', 'var a = 1')
const fileB = createFile('b.js', 'var b = 1')

test('cache one file', function (t) {
  var persist = Promise.promisify(brfypersist(tmpTarget, {}))
  return persist(fileA, null, null, processFile)
    .then(function (resultA) {
      return persist(fileA, null, null, processFile)
        .then(function (resultB) {
          t.notEqual(resultA, resultB)
          t.same(resultA, resultB)
          t.same(resultA.source, 'var a = 1 // docs')
          t.same(resultA.deps, ['foo', 'bar'])
          t.same(resultA.pkg.name, 'baz')
        })
    })
})

test('parallel caching only writes once', function (t) {
  var persist = Promise.promisify(brfypersist(tmpTarget, {}))
  var _firstFallback
  var fallback = function (source, cb) {
    if (!_firstFallback) {
      _firstFallback = cb
      return
    }
    setImmediate(function () {
      // Triggering a writing of the cache in the same tick
      _firstFallback(null, {first: true})
      cb(null, {first: false})
    })
  }
  return Promise.all([
    persist(fileB, null, null, fallback),
    persist(fileB, null, null, fallback)
  ])
    .then(wait(100)) // The cache file may not have been written yet
    .then(function (results) {
      const cacheFilePath = path.join(tmpTarget, 'bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f_d63c02b75372e4e64783538bff55c8f18ce4cf0c.json')
      t.ok(fs.existsSync(cacheFilePath), 'tmp created')
      t.same(JSON.parse(fs.readFileSync(cacheFilePath, 'utf-8')), {first: true}, 'Only the first write succeeded')
    })
})
