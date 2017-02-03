# 🚀 A Browserify Cache for Maximum speed.

[![Build Status](https://travis-ci.org/martinheidegger/browserify-persist-fs.svg?branch=master)](https://travis-ci.org/martinheidegger/browserify-persist-fs)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Coverage Status](https://coveralls.io/repos/github/martinheidegger/browserify-persist-fs/badge.svg)](https://coveralls.io/github/martinheidegger/browserify-persist-fs)

`browserify-persist-fs` stores the computation results for every file
processed in a `cache` folder which makes recomputation of previous executions
extremely fast _(particularily useful for CI!)_.

**Oh**❗️ It also comes with a logging API that can help you figure out why
your browserify execution is slow and which files cost most time!

> In our production we were able to reduce repeated requests from 40s → 6s 🎉

## Temporary disclaimer

In order to user `browserify-persist-fs` you need to have a version of browserify
that depends on [`module-deps`](https://github.com/substack/module-deps) with a
version >= 4.1.0 installed.

Only after merging [PR#124](https://github.com/substack/module-deps/pull/124)
`persistentCache` is enabled which makes all this magic possible!

I published [@leichtgewicht/browserify](https://www.npmjs.com/package/@leichtgewicht/browserify)
with a browserify version that enables this API.

## Installation & Setup

Specify `browserify-persist-fs` as `persistentCache` option.

```javascript
const browserify = require('@leichtgewicht/browserify') // for the time being...
const browserifyPersistFs = require('browserify-persist-fs')(
  '.cache', // The folder where things should be stored
  {},       // "hashObject": And object that is used to figure out if the configuration has changed
  null,     // Optional log handler (default: null)
  false     // Pass in true to disable the cache (default: false)
)
const bundle = browserify({
  persistentCache: browserifyPersistFs
})
```

## Identity of builds

When you build something with browserify you can have a lot of ways in to modify
the resulting output: `transforms`, `debug`, `sourcemap`, etc. Since it is
impossible to figure out automatically what properties may exist, **you have to
specify how the build is different**.

The second property, the `hashObject`, should be used to make sure that different
configurations of browserify don't use the same cache directory.

Usually it contains a mixture of version specifications and config flags:

```javascript
const browserifyPersistFs = require('browserify-persist-fs')('.cache',
  {
    debug: true,
    transforms: [
      require('browserify/package.json').version,
      require('browserify-shim/package.json').version
      require('uglifyify/package.json').version
    ]
  }
)
```

Make sure that this results in a good idea to ensure developer happiness ☀️ 🙆

_A [PR](https://github.com/martinheidegger/browserify-persist-fs) to make this
process better would be highly welcome._

## Persistence of folders

Usually the folders are not deleted! This means you should occasionally deleted
the old folders in the cache directory to not run out of disk space.

## Logging

```javascript
const browserifyPersistFs = require('browserify-persist-fs')('.cache', {},
  log
)

function log (entry) {
  entry.file // File that has been loaded
  entry.err  // In case an error occurred
  entry.cacheFile // The cache file location that has been used
  entry.durations.total // Total time it took to process this entry
  entry.durations.read // Time it took to read the source file
  entry.durations.cache // Time it took to read the cached content
  entry.durations.generate // Time it took to generate the resulting file
  entry.sizes.input // Size of the input file
  entry.sizes.output // Size of the output file
}
```


## License

MIT

## Mentions

I was able to work on this thanks to [Nota](https://notainc.com) that produces
[Scrapbox](https://scrapbox.io) and [Gyazo](https://gyazo.com) since we
needed this to make our build run on speed!🏃‍
