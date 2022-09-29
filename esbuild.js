/* eslint-disable @typescript-eslint/no-var-requires */
const { readFileSync } = require('fs')
const { extname, dirname: _dirname } = require('path')

const dirnamePlugin = {
  name: 'dirname',

  setup(build) {
    build.onLoad({ filter: /.*/ }, ({ path: filePath }) => {
      // if (/.*mpd-api.*/g.test(filePath)) {
      let contents = readFileSync(filePath, 'utf8')
      const loader = extname(filePath).substring(1)
      const dirname = _dirname(filePath)
      contents = contents
        .replace('__dirname', `"${dirname}"`)
        .replace('__filename', `"${filePath}"`)
      return {
        contents,
        loader,
      }
      // }
    })
  },
}

async function start(watch) {
  await require('esbuild').build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    watch,
    minify: process.env.NODE_ENV === 'production',
    sourcemap: process.env.NODE_ENV === 'development',
    mainFields: ['module', 'main'],
    external: ['coc.nvim'],
    platform: 'node',
    target: 'node10.12',
    outfile: 'lib/index.js',
    plugins: [dirnamePlugin],
  })
}

let watch = false
if (process.argv.length > 2 && process.argv[2] === '--watch') {
  console.log('watching...')
  watch = {
    onRebuild(error) {
      if (error) {
        console.error('watch build failed:', error)
      } else {
        console.log('watch build succeeded')
      }
    },
  }
}

start(watch).catch((e) => {
  console.error(e)
})
