# 常用配置

## 多产物配置

我们可以将 output 改造成一个数组，对外暴露出不同格式的产物供他人使用，不仅包括 `ESM`，也需要包括诸如`CommonJS`、`UMD`等格式，保证良好的兼容性

```javascript
import { defineConfig } from 'rollup'

export default defineConfig({
  input: 'src/index.js',
  output: [
    {
      file: 'dist/bundle-iife.js',
      format: 'iife'
    },
    {
      file: 'dist/bundle-esm.js',
      format: 'esm'
    },
    {
      file: 'dist/bundle-cjs.js',
      format: 'cjs'
    },
    {
      file: 'dist/bundle-umd.js',
      format: 'umd',
      name: 'bundle'
    }
  ]
})
```

![20240719101848](https://tuchuang.coder-sunshine.top/images/20240719101848.png)

## 多入口配置

除了多产物配置，Rollup 中也支持多入口配置

**main.js**

```javascript
// src/main.js
import util from './util.js'
const r = util.getRandomNum(1, 10)
console.log('🚀 ~ r:', r)

const obj = {
  a: 1,
  b: {
    c: 3
  }
}
const cloneObj = util.deepClone(obj)
cloneObj.b.c = 4
console.log('🚀 ~ obj:', obj)
console.log('🚀 ~ cloneObj:', cloneObj)
```

**rollup.config.js**

```javascript
import { defineConfig } from 'rollup'

export default defineConfig({
  input: ['src/index.js', 'src/main.js'],
  output: [
    {
      dir: 'dist',
      format: 'cjs'
    }
  ]
})
```

![20240719102053](https://tuchuang.coder-sunshine.top/images/20240719102053.png)

通常情况下多产物和多入口两者会被结合起来使用

```javascript
import { defineConfig } from 'rollup'
export default defineConfig({
  input: ['src/index.js', 'src/main.js'],
  output: [
    {
      dir: 'dist/cjs',
      format: 'cjs'
    },
    {
      dir: 'dist/esm',
      format: 'esm'
    }
  ]
})
```

![20240719102348](https://tuchuang.coder-sunshine.top/images/20240719102348.png)

当然，上面这样的写的话，生成的产物会把两个入口一起进行构建，我们可能的想法是一个入口一种构建方式：

```javascript
import { defineConfig } from 'rollup'
/**
 * @type {import('rollup').RollupOptions}
 */
const buildIndexOptions = {
  input: 'src/index.js',
  output: {
    dir: 'dist/umd/',
    format: 'umd',
    name: 'bundle'
  }
}

/**
 * @type {import('rollup').RollupOptions}
 */
const buildMainOptions = {
  input: 'src/main.js',
  output: {
    dir: 'dist/esm/',
    format: 'esm'
  }
}
export default [buildIndexOptions, buildMainOptions]
```

![20240719102655](https://tuchuang.coder-sunshine.top/images/20240719102655.png)

## 动态导入与默认代码分割

使用路由来说明懒加载，其实，任何时候，我们都可以使用 import 动态懒加载的方式。重新编辑一下 main.js 入口：

```javascript
// src/main.js
function run() {
  // import("./util.js").then(chunk => console.log("🚀 ~ chunk:", chunk));

  import('./util.js').then(({ default: foo }) => {
    const r = foo.getRandomNum(1, 10)
    console.log('🚀 ~ r:', r)
  })
}
run()
```

![20240719103141](https://tuchuang.coder-sunshine.top/images/20240719103141.png)

重新运行可以看到 dist 目录形成了下面的结构:

![20240719103257](https://tuchuang.coder-sunshine.top/images/20240719103257.png)

```shell
.
├── dist
│   ├── esm
│   │   ├── main.js
│   │   └── util-DCewuzOt.js
│   └── umd
│       └── index.js
└── ...
```

Rollup 将使用动态导入创建一个仅在需要时加载的单独块。所以可以看到这里多了一个`util-DCewuzOt.js`的文件

> **注意：**为了让 Rollup 知道在哪里放置第二个块，我们不使用 `--file` 选项，而是使用 `--dir` 选项设置一个输出文件夹

其中，`util-DCewuzOt.js`是自动生成的`chunk-[hash].js`的名字，`[hash]` 是基于内容的哈希字符串。可以通过指定 [`output.chunkFileNames`](https://cn.rollupjs.org/configuration-options/#output-chunkfilenames) (chunk 文件)和 [`output.entryFileNames`](https://cn.rollupjs.org/configuration-options/#output-entryfilenames) (打包入口文件)选项来提供自己的命名模式。

```javascript
/**
 * @type {import('rollup').RollupOptions}
 */
const buildMainOptions = {
  input: 'src/main.js',
  output: {
    dir: 'dist/esm/',
    entryFileNames: '[name].js',
    chunkFileNames: 'chunk-[name]-[hash].js',
    format: 'esm'
  }
}
```

![20240719103531](https://tuchuang.coder-sunshine.top/images/20240719103531.png)

而且，很智能的是，如果这个时候，我定义了有多个入口点都调用了`util.js`文件，会自动的引入分割出来的文件

```javascript
/**
 * @type {import('rollup').RollupOptions}
 */
const buildMainOptions = {
  input: ['src/main.js', 'src/main2.js'],
  output: {
    dir: 'dist/esm/',
    entryFileNames: '[name].js',
    chunkFileNames: 'chunk-[name]-[hash].js',
    format: 'esm'
  }
}
```

在打包后的 main2.js 中，可以看到这样的引用：

```javascript
import util from './chunk-util-371e3ef9.js'
```

## 使用插件

到目前为止，我们已经用入口文件和通过相对路径导入的模块打了一个简单的包。随着需要打包更复杂的代码，通常需要更灵活的配置，例如导入使用 NPM 安装的模块、使用 Babel 编译代码、处理 JSON 文件等等。

插件列表 ： [the Rollup Awesome List](https://github.com/rollup/awesome)。

### [@rollup/plugin-node-resolve](https://github.com/rollup/plugins/tree/master/packages/node-resolve)

比如现在引入 lodash-es 库

```shell
pnpm add lodash-es -D
```

在 index.js 中使用

```javascript
import { chunk } from 'lodash-es'
const r = chunk([1, 2, 3, 4], 2)
console.log('🚀 ~ r:', r)
```

现在直接打包

```javascript
/**
 * @type {import('rollup').RollupOptions}
 */
const buildIndexOptions = {
  input: 'src/index.js',
  output: {
    dir: 'dist/esm/',
    format: 'esm'
  }
}
export default buildIndexOptions
```

会出现下面的警告：

```shell
src/index.js → dist/esm/...
(!) Unresolved dependencies
https://rollupjs.org/troubleshooting/#warning-treating-module-as-external-dependency
lodash-es (imported by "src/index.js")
created dist/esm/ in 13ms
```

意思是，不能解析`lodash-es`这个依赖，报出了警告，问你是不是需要`external`，并提示你点击链接有这个警告的解释。当我们点击这个链接，按照提示解决这个 external 警告问题，很简单，就加上 external，也就是把`lodash-es`这个库给排除出去

```diff
const buildIndexOptions = {
  input: 'src/index.js',
  output: {
    dir: 'dist/esm/',
    format: 'esm',
  },
+  external: ['lodash-es']
}
export default buildIndexOptions
```

再此打包，果然没警告了，而且我们在 nodejs 环境中确实也能正常运行了

> **注意：对于没有太多开发经验的来说，这里感觉问题解决了，但是需要理解为什么**
>
> **注意：对于没有太多开发经验的来说，这里感觉问题解决了，但是需要理解为什么**
>
> **注意：对于没有太多开发经验的来说，这里感觉问题解决了，但是需要理解为什么**

重要的事情说三遍，这里虽然看似一个很小的问题，但是却有很多基本理论点

1、rollup 默认只能解析导入的相对路径，也就是`/` ， `./`或者`../`开头的路径，对于`bare import`，也就是`import { chunk } from 'lodash-es';`这种直接导入的第三方包的格式，并不支持

2、`rollup`相比`webpack`最大的优势并不是构建一个足够大的应用打包，大多是情况下，我们使用`rollup`用来构建工具库，因此，这里导入的`lodash-es`并没有报错，而仅仅报出警告，因为`rollup`认为`lodash-es`这个库并没有加入构建，那么意思是将来用作第三方库来使用，因此将`lodash-es`使用配置`external`排除掉就好。

3、`lodash-es`这个包本身就是支持 ESM 的

4、最后打包好的`index.js`文件之所以能在`nodejs`环境下运行，是因为`nodejs`可以帮我们解析`bare import`，我们可以试着将`index.js`放入到`html`文件中运行，你就可以看到其中的问题所在，在 html 环境中就会报错了：`index.html:1 Uncaught TypeError: Failed to resolve module specifier "lodash-es". Relative references must start with either "/", "./", or "../".`

![20240719105950](https://tuchuang.coder-sunshine.top/images/20240719105950.png)

![20240719110000](https://tuchuang.coder-sunshine.top/images/20240719110000.png)

如果希望在最后的打包中，将`lodash-es`内容解析打包进去，就可以使用`@rollup/plugin-node-resolve`

**安装:**

```shell
pnpm add @rollup/plugin-node-resolve --save-dev
```

**使用：**

```javascript
import { nodeResolve } from '@rollup/plugin-node-resolve'
/**
 * @type {import('rollup').RollupOptions}
 */
const buildIndexOptions = {
  input: 'src/index.js',
  output: {
    dir: 'dist/esm/',
    format: 'esm'
  },
  plugins: [nodeResolve()]
  // external: ['lodash-es']
}
export default buildIndexOptions
```

现在，再此进行打包，无论是打包时间，还是打包内容和之前都很不一样了，把`lodash-es`中，关于`chunk()`函数的内容，都打包进了`index.js`文件中

![20240719110049](https://tuchuang.coder-sunshine.top/images/20240719110049.png)

![20240719110219](https://tuchuang.coder-sunshine.top/images/20240719110219.png)

### [output.manualChunks](https://cn.rollupjs.org/configuration-options/#output-manualchunks)

上面讲了对于动态加载模块，rollup 帮我们自动做了代码分割，其实我们也可以手动的操作，直接在 rollup 配置中声明

```javascript
const buildIndexOptions = {
  input: 'src/index.js',
  output: {
    dir: 'dist/esm/',
    format: 'esm',
    entryFileNames: '[name].js',
    chunkFileNames: 'chunk-[name]-[hash].js',
    manualChunks: {
      'lodash-es': ['lodash-es']
    }
    //也可以是函数形式
    // manualChunks(id){
    //   if(id.includes('lodash-es')){
    //     return 'lodash-es'
    //   }
    // }
  },
  plugins: [nodeResolve()]
}
```

### [@rollup/plugin-commonjs](https://github.com/rollup/plugins/tree/master/packages/commonjs)

上面最开始导入`lodash-es`，没有加入`external`和`plugins`，之所以还能直接运行，还因为`lodash-es`本身就是支持 ESM 的，因为 rollup 默认并不支持 Commonjs 模块化，比如将 lodash-es 换位 lodash，马上就能看到不一样的效果,直接打包失败

![20240719110811](https://tuchuang.coder-sunshine.top/images/20240719110811.png)

![20240719110826](https://tuchuang.coder-sunshine.top/images/20240719110826.png)

```javascript
[!] RollupError: "chunk" is not exported by "node_modules/.pnpm/lodash@4.17.21/node_modules/lodash/lodash.js", imported by "src/index.js".
https://rollupjs.org/troubleshooting/#error-name-is-not-exported-by-module
```

这个错误在官网上解释的很清楚了，无非就是 commonjs 没有这种导出，因此我们需要`@rollup/plugin-commonjs`帮我们处理 commonjs 模块化的问题

**安装:**

```shell
pnpm add @rollup/plugin-commonjs --save-dev
```

**使用:**

```diff
import { nodeResolve } from '@rollup/plugin-node-resolve';
+import commonjs from '@rollup/plugin-commonjs';
/**
 * @type {import('rollup').RollupOptions}
 */
const buildIndexOptions = {
  input: 'src/index.js',
  output: {
    dir: 'dist/esm/',
    format: 'esm',
  },
+  plugins: [nodeResolve(), commonjs()]
}
export default buildIndexOptions
```

### [@rollup/plugin-babel](https://github.com/rollup/plugins/tree/master/packages/babel)

使用 [Babel](https://babeljs.io/) 来使用尚未被浏览器和 Node.js 支持的最新 JavaScript 特性。

使用 Babel 和 Rollup 最简单的方法是使用 [@rollup/plugin-babel](https://github.com/rollup/plugins/tree/master/packages/babel)

**安装:**

```shell
pnpm add @rollup/plugin-babel -D
```

**使用：**

```diff
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
+import babel from '@rollup/plugin-babel';
/**
 * @type {import('rollup').RollupOptions}
 */
const buildIndexOptions = {
  input: 'src/index.js',
  output: {
    dir: 'dist/esm/',
    format: 'esm',
  },
  plugins: [
    nodeResolve(),
    commonjs(),
+    babel({ babelHelpers: 'bundled' })
  ]
}
export default buildIndexOptions
```

不过这么做之后，打包代码并不会有什么变化，因为我们都知道 babel 是需要预设的.

安装 [`babel-core`](https://babeljs.io/docs/en/babel-core) 和 [`env`](https://babeljs.io/docs/en/babel-preset-env) 预设

```javascript
pnpm add -D @babel/core @babel/preset-env
```

在 Babel 实际编译代码之前，需要进行配置。在项目根目录创建一个名为 `.babelrc.json` 的新文件

```javascript
{
  "presets": ["@babel/preset-env"]
}
```

具体的 babel 设置，可以参考[**babel 文档**](https://babeljs.io/docs/config-files#project-wide-configuration)

#### 题外话：@babel/runtime

我们在`index.js`代码中加入如下的 api

```javascript
import { getRandomNum } from './util.js'
const r = getRandomNum(1, 10)
console.log(r)

const arr = [1, 2, 3, 4].map(item => item * item)
console.log('🚀 ~ arr:', arr)

Promise.resolve(1).then(res => {
  console.log(res)
})
```

我们通过 babel 处理之后会发现一些问题：

@babel/preset-env 只转换了语法，也就是我们看到的箭头函数、const 一类，但是对于进一步需要转换内置对象、实例方法等等 API，就显得无能为力了，这些代码需要**polyfill(兼容性垫片)**。所以这个我需要`@babel/runtime`来帮我们处理。

`@babel/runtime`是一个核心， 一种实现方式，但是在实现 polyfill 垫片的过程中，可能会产生很多重复的代码，所以需要`@babel/plugin-transform-runtime`防止污染全局， 抽离公共的 helper function , 防止冗余，当然在处理 polyfill 的时候，我们还需要 core-js 的辅助，基于 babel，我们可以使用`@babel/runtime-corejs3`

**安装：**

```shell
pnpm add @babel/plugin-transform-runtime -D
pnpm add @babel/runtime @babel/runtime-corejs3
```

要使用`@babel/plugin-transform-runtime`，`@rollup/plugin-babel`的[**babelHelper**](https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers)处理必须改为 runtime

```javascript
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'
/**
 * @type {import('rollup').RollupOptions}
 */
const buildIndexOptions = {
  input: 'src/index.js',
  output: {
    dir: 'dist/esm/',
    format: 'esm'
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    babel({
      babelHelpers: 'runtime',
      include: 'src/**',
      exclude: 'node_modules/**',
      extensions: ['.js', '.ts']
    }),
    typescript()
  ]
}
export default buildIndexOptions
```

**.babelrc.json：**

```javascript
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": "> 0.25%, not dead",
        "useBuiltIns": "usage",
        "corejs": 3
      }
    ]
  ],
  "plugins": [
    [
      "@babel/plugin-transform-runtime",
      {
        "corejs": 3
      }
    ]
  ]
}
```

这个时候你再进行构建，会发现打包后的文件多出了一大堆，这其实就是 polyfill 中的代码。

### [@rollup/plugin-typescript](https://github.com/rollup/plugins/tree/master/packages/typescript)

要使用 typescript 就需要依赖这个插件，当然这个插件本身还依赖了`typescript`和`tslib`，因此我们需要导入 3 个包

```shell
pnpm add typescript tslib @rollup/plugin-typescript -D
```

**util.ts**

```typescript
/**
 * 深拷贝
 * @param obj 需要深拷贝的对象
 * @returns 深拷贝对象
 */
export const deepClone = <T>(obj: T): T => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  const result: any = Array.isArray(obj) ? [] : {}
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = deepClone(obj[key])
    }
  }
  return result
}

export const getRandomNum = (min: number, max: number): number => {
  let num = Math.floor(Math.random() * (min - max) + max)
  return num
}
```

Index.ts

```typescript
import { getRandomNum, deepClone } from './util.ts'
const r = getRandomNum(1, 10)
console.log(r)

const obj = { a: 1, b: { c: 3 } }
const obj2 = deepClone(obj)
obj2.b.c = 4

console.log(obj)
console.log(obj2)
```

配置文件

**rollup.config.ts**

```typescript
import { RollupOptions } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'

const config: RollupOptions = {
  input: 'src/index.ts',
  output: {
    file: 'dist/umd/index.js',
    format: 'umd',
    name: 'rollupDemo'
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    babel({
      babelHelpers: 'runtime',
      include: 'src/**',
      exclude: 'node_modules/**',
      extensions: ['.js', '.ts']
    }),
    typescript()
  ]
}
export default config
```

**tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "esnext",
    "target": "es5",
    "lib": ["esnext", "dom", "dom.iterable"],
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*", "rollup.config.ts"]
}
```

> **注意：**别忘记 tsconfig.json 文件中需要加入 rollup.config.ts 配置文件,不然要报错

```diff
{
  "compilerOptions": {
    ......
  },
+  "include": ["src/**/*","rollup.config.ts"],
}
```

**运行：**

```shell
npx rollup -c rollup.config.ts --configPlugin typescript
```
