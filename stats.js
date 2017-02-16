function fmt (float) {
  if (float === undefined) {
    float = 0
  }
  return ((float * 100) | 100) / 100
}

module.exports = function () {
  var stats = []
  function process () {
    return stats.reduce(function (compiled, entry) {
      compiled.read += (entry.durations.cache || 0) + (entry.durations.read || 0)
      compiled.generate += (entry.durations.generate || 0)
      if (entry.err) {
        compiled.errorFiles += 1
      } else if (entry.cached) {
        compiled.cached += 1
      } else {
        compiled.built += 1
      }
      return compiled
    }, {
      read: 0,
      generate: 0,
      cached: 0,
      built: 0,
      errorFiles: 0,
      slowest: stats
        .sort(function (a, b) {
          return a.durations.total > b.durations.total ? -1 : 1
        })
        .slice(0, 20)
    })
  }
  return {
    update: function (entry) {
      stats.push(entry)
    },
    process: process,
    render: function (deletionErr, deletedFiles) {
      var data = process()
      return '' +
        'Avg. duration per file for reading: ' + fmt(data.read / stats.length) + 'ms\n' +
        'Avg. duration per file for generating: ' + fmt(data.generate / stats.length) + 'ms\n' +
        'Files built: ' + data.built + '\n' +
        'Files with error: ' + data.errorFiles + '\n' +
        'Files cached: ' + data.cached + '\n' +
        'Garbage collected files: ' + (deletedFiles ? deletedFiles.length : deletionErr) + '\n' +
        'Slowest files:\n' + data.slowest.map(function (entry) {
          return '- ' + entry.file + ' (total: ' +
            fmt(entry.durations.total) + 'ms, reading: ' +
            fmt(entry.durations.read) + 'ms, generating: ' +
            fmt(entry.durations.generate) + 'ms, parallel: ' +
            entry.parallel + ')'
        }).join('\n')
    }
  }
}

