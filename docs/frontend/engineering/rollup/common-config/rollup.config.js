import { defineConfig } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'

// export default defineConfig({
//   // input: 'src/index.js',
//   // 多入口配置
//   input: ['src/index.js', 'src/main.js'],
//   // output: [
//   //   {
//   //     file: 'dist/bundle-iife.js',
//   //     format: 'iife'
//   //   },
//   //   {
//   //     file: 'dist/bundle-esm.js',
//   //     format: 'esm'
//   //   },
//   //   {
//   //     file: 'dist/bundle-cjs.js',
//   //     format: 'cjs'
//   //   },
//   //   {
//   //     file: 'dist/bundle-umd.js',
//   //     format: 'umd',
//   //     name: 'bundle'
//   //   }
//   // ]
//   // output: [
//   //   {
//   //     dir: 'dist',
//   //     format: 'cjs'
//   //   }
//   // ]

//   // 多产物多入口配置
//   output: [
//     {
//       dir: 'dist/cjs',
//       format: 'cjs'
//     },
//     {
//       dir: 'dist/esm',
//       format: 'esm'
//     }
//   ]
// })

// 一个入口一种构建方式
/**
 * @type {import('rollup').RollupOptions}
 */
// const buildIndexOptions = {
//   input: 'src/index.js',
//   output: {
//     dir: 'dist/umd/',
//     format: 'umd',
//     name: 'bundle'
//   }
// }

/**
 * @type {import('rollup').RollupOptions}
 */
// const buildMainOptions = {
//   input: 'src/main.js',
//   output: {
//     dir: 'dist/esm/',
//     format: 'esm'
//   }
// }

// const buildMainOptions = {
//   input: 'src/main.js',
//   output: {
//     dir: 'dist/esm/',
//     entryFileNames: '[name].js',
//     chunkFileNames: 'chunk-[name]-[hash].js',
//     format: 'esm'
//   }
// }

// const buildMainOptions = {
//   input: ['src/main.js', 'src/main2.js'],
//   output: {
//     dir: 'dist/esm/',
//     entryFileNames: '[name].js',
//     chunkFileNames: 'chunk-[name]-[hash].js',
//     format: 'esm'
//   }
// }

// export default [buildIndexOptions, buildMainOptions]

/**
 * @type {import('rollup').RollupOptions}
 */
// const buildIndexOptions = {
//   input: 'src/index.js',
//   output: {
//     dir: 'dist/esm/',
//     format: 'esm'
//   },
//   // 排除 lodash-es
//   // external: ['lodash-es']
//   plugins: [nodeResolve()]
// }
// export default buildIndexOptions

const buildIndexOptions = {
  input: 'src/index.js',
  output: {
    dir: 'dist/esm/',
    format: 'esm',
    entryFileNames: '[name].js',
    chunkFileNames: 'chunk-[name]-[hash].js'
    // 手动代码分割
    // manualChunks: {
    //   'lodash-es': ['lodash-es']
    // }
    //也可以是函数形式
    // manualChunks(id){
    //   if(id.includes('lodash-es')){
    //     return 'lodash-es'
    //   }
    // }
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    babel({
      babelHelpers: 'runtime',
      include: 'src/**',
      exclude: 'node_modules/**',
      extensions: ['.js', '.ts']
    })
  ]
}
export default buildIndexOptions
