// 打包packages目录下面的模块 --> 主要就是找到入口出口，然后配置 esbuild 打包
// 通过 package.json 中的 dev命令 执行对应的打包操作
// "dev": "node scripts/dev.js reactivity -f esm" 这个就是打包 reactivity 模块，-f esm 表示打包成 esm 模块

import { parseArgs } from 'node:util'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'
import { createRequire } from 'node:module'

/**
 * 解析命令行参数
 */
const {
  values: { format: rawFormat },
  // 获取所有位置参数（如 node scripts/dev.js vue 中的 vue）。
  positionals,
} = parseArgs({
  // 表示允许解析位置参数（即不带 --key 的参数）。
  allowPositionals: true,
  // 表示允许解析格式为 --format 的参数。
  options: {
    format: {
      type: 'string',
      short: 'f',
      default: 'esm',
    },
  },
})

/**
 * @description 打包的是哪个项目
 */
const target = positionals.length ? positionals[0] : 'vue'

/**
 * @description 打包成什么格式
 */
const format = rawFormat || 'esm'

// 创建 esm 的 __filename
const __filename = fileURLToPath(import.meta.url)
// 创建 esm 的 __dirname
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

/**
 * @description 入口
 */
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
console.log('entry', entry)

/**
 * --format cjs or esm
 * cjs => reactive.cjs.js
 * esm => reactive.esm.js
 * @type {string}
 */
const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`,
)

const pkg = require(`../packages/${target}/package.json`)

esbuild.context({
  entryPoints: [entry], // 入口文件
  outfile, // 输出文件
  format, // 打包格式
  platform: format === 'cjs' ? 'node' : 'browser', // 打包平台 node browser
  sourcemap: true, // 开启 sourcemap 方便调试
  bundle: true, // 把所有的依赖，打包到一个文件中
  globalName: pkg.buildOptions.name,
}).then(ctx=> {
  // 监听文件变化，重新打包
  ctx.watch()
})
