const tap = require('tap')
const Promise = require('bluebird')
const test = tap.test
const brfypersist = require('../')
const fs = require('fs')
const path = require('path')
const tmp = require('os-tmpdir')
const tmpSource = tmp()
const tmpTarget = tmp()

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

const fileA = createFile('a.js', 'var a = 1')

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
