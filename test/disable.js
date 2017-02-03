const test = require('tap').test
const brfypersist = require('../')
const fs = require('fs')

test('disabling it returns in null', function (t) {
  t.equals(brfypersist('', {}, null, true), null)
  t.end()
})

test('disabled with log should still give a logger', function (t) {
  const tmpFolder = fs.mkdtempSync('./.test/disable_log_')
  t.notEquals(brfypersist(tmpFolder, {}, function () {}, false), null)
  t.end()
})
