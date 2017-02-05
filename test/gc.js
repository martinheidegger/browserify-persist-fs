const test = require('tap').test
const brfypersist = require('../')
const tmpDir = require('./util/tmpDir')
const Promise = require('bluebird')
const path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs')

function processFile (source, cb) {
  cb(null, {
    source: source + 'abcd',
    deps: ['fancy', 'button'],
    pkg: {}
  })
}

function prepareGarbage (delayedBy, name, options) {
  const tmpTarget = path.join(tmpDir, 'gc_target', name)
  const tmpSource = path.join(tmpDir, 'gc_source', name)

  function createFile (name, data) {
    var file = path.join(tmpSource, name)
    fs.writeFileSync(file, data)
    return file
  }

  mkdirp.sync(tmpSource)

  var persist = Promise.promisify(brfypersist(tmpTarget, {}))

  const files = [
    createFile('a.js', 'a'),
    createFile('b.js', 'bcde'),
    createFile('c.js', 'cdefghi')
  ]

  var delay = 0
  return Promise.all(files.map(function (file) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        resolve(persist(file, null, null, processFile))
      }, (delay += 1) * delayedBy)
    })
  })).then(function () {
    return Promise.promisify(persist.gc)(options)
  }).then(function (deleted) {
    return Promise.map(deleted, function (deletedFile) {
      return new Promise(function (resolve, reject) {
        fs.access(deletedFile, function (err) {
          if (!err) {
            return reject(new Error('Expected `' + deletedFile + '` to be deleted.'))
          }
          resolve()
        })
      })
    }).then(function () {
      return deleted
    })
  })
}

test('garbage collect without options should do nothing', function (t) {
  return prepareGarbage(0, 'size', {
  }).then(function (data) {
    t.equals(data.length, 0)
  })
})

test('garbage collect by size', function (t) {
  return prepareGarbage(0, 'size', {
    maxSize: 100
  }).then(function (data) {
    t.equals(data.length, 2)
  })
})

test('garbage collect by age', function (t) {
  return prepareGarbage(2000, 'age', {
    maxAge: 3000
  }).then(function (data) {
    t.equals(data.length, 1)
  })
})

test('garbage collect by count', function (t) {
  return prepareGarbage(0, 'age', {
    maxCount: 2
  }).then(function (data) {
    t.equals(data.length, 1)
  })
})
