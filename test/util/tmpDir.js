const tmp = require('os-tmpdir')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const path = require('path')
const tmpDir = path.join(tmp(), 'browserify-persist-fs')

rimraf.sync(tmpDir)
mkdirp.sync(tmpDir)

module.exports = tmpDir
