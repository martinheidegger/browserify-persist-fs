const test = require('tap').test
const brfypersist = require('../')
const tmpDir = require('./util/tmpDir')
const path = require('path')

test('disabling it returns in null', function (t) {
  t.equals(brfypersist('', {}, null, true), null)
  t.end()
})

test('disabled with log should still give a logger', function (t) {
  const tmpFolder = path.join(tmpDir, 'disable_log')
  t.notEquals(brfypersist(tmpFolder, {}, function () {}, false), null)
  t.end()
})
