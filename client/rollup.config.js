import typescript from 'rollup-plugin-typescript2';
const filesize = require('rollup-plugin-filesize');

export default {
  input: 'src/index.ts',
  plugins: [
    typescript({
      cacheRoot: `/tmp/.rpt2_cache`,
      strict: true
    }),
    filesize()
  ],
  output: {
    file: 'www/index.js',
    format: 'iife'
  }
}
