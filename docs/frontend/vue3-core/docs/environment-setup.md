# Monorepo 环境配置

Monorepo 是一种将多个项目代码存储在同一个代码仓库中的开发策略，而不是将每个项目分散到不同的代码仓库中。

## 主要优势

1. **代码共享和复用**
   - 更容易共享公共代码
   - 统一的依赖管理
   - 便于抽取公共模块
2. **依赖管理**
   - 统一的版本控制
   - 避免依赖冲突
   - 简化依赖更新
3. **工程化管理**
   - 统一的构建流程
   - 统一的代码规范
   - 统一的测试策略

## vue3源码目录结构

```Plain Text
packages/
├── compiler-core/          # 编译器核心代码
├── compiler-dom/          # 浏览器平台编译器
├── compiler-sfc/          # 单文件组件编译器
├── compiler-ssr/          # 服务端渲染编译器
├── reactivity/            # 响应式系统
├── runtime-core/          # 运行时核心代码
├── runtime-dom/           # 浏览器运行时
├── runtime-test/          # 测试相关运行时
├── server-renderer/       # 服务端渲染
├── shared/               # 共享工具代码
└── vue/                  # 完整版本入口
```

## 项目搭建

### 初始化 pnpm 项目

```Bash
pnpm init
```

### 配置 pnpm workspace

```YAML
packages:
  - 'packages/*' # 所有子包存放在 packages 目录
```

### 创建子包

```Plain Text
vue3-core/
├── package.json
├── pnpm-workspace.yaml
├── packages/
│   └── reactivity/
│   └── vue/
```

### 安装依赖

安装依赖的时候需要注意按照 Monorepo 规范安装

```Bash
pnpm add typescript -D -w
```

### 配置 ts

- tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext", // 指定 ECMAScript 目标版本
    "module": "ESNext", // 指定模块代码生成规范
    "moduleResolution": "node", // 指定模块解析策略
    "outDir": "dist", // 指定编译输出的目录
    "resolveJsonModule": true, // 允许导入 JSON 文件
    "strict": false, // 关闭严格模式
    "lib": ["ESNext", "DOM"], // 指定要使用的库文件
    "paths": {
      "@vue/*": ["packages/*/src"]
    },
    "baseUrl": "./"
  }
}
```

### 配置esbuild打包

```Bash
pnpm add esbuild -D -w
```

- scripts/dev.js

```js
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
const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`)

const pkg = require(`../packages/${target}/package.json`)

esbuild
  .context({
    entryPoints: [entry], // 入口文件
    outfile, // 输出文件
    format, // 打包格式
    platform: format === 'cjs' ? 'node' : 'browser', // 打包平台 node browser
    sourcemap: true, // 开启 sourcemap 方便调试
    bundle: true, // 把所有的依赖，打包到一个文件中
    globalName: pkg.buildOptions.name,
  })
  .then(ctx => {
    // 监听文件变化，重新打包
    ctx.watch()
  })
```

- package.json

```json
 "scripts": {
    "dev": "node scripts/dev.js reactivity"
  },
```

> [!TIP]
> "dev": "node scripts/dev.js reactivity -f esm" 这个就是打包 reactivity 模块，-f esm 表示打包成 esm 模块
