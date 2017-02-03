# 🚀 A Browserify Cache for Maximum speed.

`browserify-persist-fs` stores the computation results for every file
processed in a `cache` folder which makes recomputation of previous executions
extremely fast _(particularily useful for CI!)_.

Oh❗️ It also comes with a logging API that can help you figure out why
your browserify execution is slow and which files cost most time!

> In our production we were able to reduce repeated requests from 40s →　6s

## Temporary disclaimer

In order to user `browserify-persist-fs` you need to have a version of browserify
that depends on [`module-deps`](https://github.com/substack/module-deps) with a
version >= 4.1.0 installed.
Only after merging [PR#124](https://github.com/substack/module-deps/pull/124)
`persistentCache` is enabled which makes all this magic possible!

I published [@leichtgewicht/browserify](https://www.npmjs.com/package/@leichtgewicht/browserify)
with a browserify version that enables this API.

## Installation & Setup

Specify `browserify-persist-fs` as

```javascript
const browserify = require('browserify')
const browserifyPersistFs = require('browserify-persist-fs')(
  '.cache', // The folder where things should be stored
  {}, // And object that is used to figure out if the configuration has changed
)
const bundle = browserify({
  persistentCache: browserifyPersistFs
})
```

## Logging





## License

MIT

## Mentions

I was able to work on this thanks to [Nota](https://notainc.com) that produces
[Scrapbox](https://scrapbox.io) and [Gyazo](https://gyazo.com) since we
needed this to make our build run on speed!🏃‍
