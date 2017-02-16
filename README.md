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

By installing a clean version of browserify v14.1.0 or newer,
you will get the required `module-deps` version.

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

## Garbage Collection

`browserify-persist-fs` does not automatically delete old cache files. You will
run out of disk space if the old files are not regularly deleted.

`browserify-persist-fs` offers an API that allows you to delete old files:

```javascript
const browserifyPersistFs = require('browserify-persist-fs')('.cache', { /*...*/ })
browserifyPersistFs.gc({
  maxAge: 100000, // Age of a file in milliseconds (Default: Number.MAX_SAFE_INTEGER)
  maxCount: 10000, // Maximum count of files in the cache folder (Default: Number.MAX_SAFE_INTEGER)
  maxSize: 10000, // Maximum size in bytes that all files accumulatively might have (Default: Number.MAX_SAFE_INTEGER)
  parallel: 10 // Maximum parallel processes to run (Default: 20)
}, function (err, deletedFiles) {
  // deletedFiles holds the path of all files that got deleted
})
```

You have to specify at least `maxAge`, `maxCount` or `maxSize`. Any combination
is possible as well.

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

## Statistics

Using the above-mentioned Logging capabilities it is possible to generate
statistics about the project that you are rendering. These statistics can
give clarity about why builds are slow and if everything worked right.

`browserify-persist-fs` comes with a small statistics module that can generate
a useful view:

```javascript
const stats = require('browserify-persist-fs/stats')()
const browserifyPersistFs = require('browserify-persist-fs')('.cache', {}, stats.update)

// ...
// After processing and gc:

browserifyPersistFs.gc({/*...*/, function (err, deletedFiles) {
  console.log(stats.render(err, deletedFiles))
})
```

which should show something like:

```
Avg. duration pre file for reading: 109.9ms
Avg. duration per file for generating: 1ms
Files built: 0
Files with error: 0
Files cached: 1155
Garbage collected files: 0
Slowest files:
- /Users/martinheidegger/project/client/js/app/components/draw/DrawObjectText.js (total: 257ms, reading: 105.96ms, generating: 1ms)
- /Users/martinheidegger/project/client/js/app/components/draw/DrawObjectCanvas.js (total: 255.98ms, reading: 106.21ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/rgb2hex/index.js (total: 255.9ms, reading: 126.53ms, generating: 1ms)
- /Users/martinheidegger/project/client/js/app/components/draw/DrawObjectPen.js (total: 255.73ms, reading: 106.07ms, generating: 1ms)
- /Users/martinheidegger/project/client/js/app/components/draw/StampTool.js (total: 254.7ms, reading: 105.96ms, generating: 1ms)
- /Users/martinheidegger/project/client/js/app/components/draw/ToolButtons.js (total: 254.68ms, reading: 106.23ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react-bootstrap/lib/utils/index.js (total: 252.14ms, reading: 129.16ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/jsondiffpatch/src/main.js (total: 247.01ms, reading: 130.37ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/ReactPropTypeLocationNames.js (total: 244.29ms, reading: 101.02ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/checkReactTypeSpec.js (total: 244.31ms, reading: 99.56ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/canDefineProperty.js (total: 244.21ms, reading: 101.09ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/traverseAllChildren.js (total: 244.21ms, reading: 100.87ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/ReactPropTypesSecret.js (total: 243.18ms, reading: 99.58ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/reactProdInvariant.js (total: 242.94ms, reading: 101.01ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/PooledClass.js (total: 243.1ms, reading: 100.84ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/ReactComponentTreeHook.js (total: 243.02ms, reading: 99.56ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/ReactNoopUpdateQueue.js (total: 242.93ms, reading: 99.58ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/getIteratorFn.js (total: 241.89ms, reading: 99.83ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/ReactElementSymbol.js (total: 241.83ms, reading: 98.3ms, generating: 1ms)
- /Users/martinheidegger/project/node_modules/react/lib/ReactCurrentOwner.js (total: 241.67ms, reading: 98.31ms, generating: 1ms)
```

## License

MIT

## Mentions

I was able to work on this thanks to [Nota](https://notainc.com) that produces
[Scrapbox](https://scrapbox.io) and [Gyazo](https://gyazo.com) since we
needed this to make our build run on speed!🏃‍
