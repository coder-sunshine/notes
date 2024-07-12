## 后处理器

CSS 后处理器不会提供专门的语法，它是在原生的 CSS 代码的基础上面做处理，常见的处理工作如下：

1. 兼容性处理：自动添加浏览器前缀（如 -webkit-、-moz- 和 -ms-）以确保跨浏览器兼容性。这种后处理器的一个典型例子是 autoprefixer。
2. 代码优化与压缩：移除多余的空格、注释和未使用的规则，以减小 CSS 文件的大小。例如，cssnano 是一个流行的 CSS 压缩工具。
3. 功能增强：添加新的 CSS 特性，使开发者能够使用尚未在所有浏览器中实现的 CSS 功能。例如，PostCSS 是一个强大的 CSS 后处理器，提供了很多插件来扩展 CSS 的功能。
4. 代码检查与规范：检查 CSS 代码的质量，以确保代码符合特定的编码规范和最佳实践。例如，stylelint 是一个强大的 CSS 检查工具，可以帮助你发现和修复潜在的问题。

后处理器实际上是有非常非常多的，autoprefixer、cssnano（压缩 css）、stylelint 像这些工具都算是在对原生 CSS 做后处理工作。这里就会涉及到一个问题，能够对 CSS 做后处理的工具（后处理器）非常非常多，此时就会存在我要将原生的 CSS 先放入到 A 工具进行处理，处理完成后放入到 B 工具进行处理，之后在 C、D、E、F.... 这种手动操作显然是比较费时费力的，我们期望有一种工具，能够自动化的完成这些后处理工作，这个工具就是 PostCSS。

## Postcss 简介

PostCSS 是一个使用 JavaScript 编写的 CSS 后处理器，它更像是一个平台，**类似于 Babel**，它本身是不做什么具体的事情，它只负责一件事情，**将原生 CSS 转换为 CSS 的抽象语法树（CSS AST），之后的事情就完全交给其他的插件**。目前整个 PostCSS 插件生态有 200+ 的插件，每个插件可以帮助我们处理一种 CSS 后处理场景。可以在官网：[https://www.postcss.parts/](https://www.postcss.parts/) 看到 PostCSS 里面所有的插件。

## Postcss 配置

### Postcss 常用插件

#### autoprefixer 和 postcss-preset-env

```css
@custom-selector :--heading h1, h2, h3, h4, h5, h6;

![alt text'undefined(image-14.png)'] .flex {
  display: flex;
  font-size: 200px;
}

:--heading {
  margin-top: 20px;
}
```

![20240712135056](https://tuchuang.coder-sunshine.top/images/20240712135056.png)

```typescript
import fs from 'node:fs'
import path from 'node:path'
import postcss, { type AcceptedPlugin } from 'postcss'
import autoprefixer from 'autoprefixer'
import postcssPresetEnv from 'postcss-preset-env'

// 读取css
const css = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8')

//browserList
const browserList: string[] = ['ie >=8', 'chrome >= 31', 'firefox >= 31', 'safari >= 7', 'opera >= 23']

//JavaScript TC39
//stage 0 草案
//stage 1 提案被认可了 但是还是不稳定
//stage 2 已经做出来了 这个promise
//stage 3 比较稳定了 各种边界也处理了 即将成为标准
//stage 4 最折磨人的一个阶段 TC39组织就要通知各个浏览器厂商 实现这个代码

const plugins: AcceptedPlugin[] = [
  autoprefixer(browserList),
  postcssPresetEnv({
    stage: 0 // 需要适配到哪一个阶段
  })
]

postcss(plugins)
  .process(css, { from: undefined })
  .then(result => {
    console.log(result.css)
  })
```

运行结果如下，可以看到已经加上了浏览器前缀了，自定义选择器也被解析了

![20240712133750](https://tuchuang.coder-sunshine.top/images/20240712133750.png)

下面是关于 stage0 到 stage4 各个阶段的介绍：

- Stage 0：草案 - 此阶段的规范还在非正式的讨论和探讨阶段，可能会有很多变化。通常不建议在生产环境中使用这些特性。
- Stage 1：提案 - 此阶段的规范已经有了一个正式的文件，描述了新特性的初步设计。这些特性可能在未来变成标准，但仍然可能发生较大的改变。
- Stage 2：草稿 - 在这个阶段，规范已经相对稳定，描述了功能的详细设计。一般来说，浏览器厂商会开始实现并测试这些特性。开发者可以在实验性的项目中尝试使用这些功能，但要注意跟踪规范的变化。 **(stage 默认配置为 2)**
- Stage 3：候选推荐 - 此阶段的规范已经基本稳定，主要进行浏览器兼容性测试和微调。开发者可以考虑在生产环境中使用这些特性，但需要确保兼容目标浏览器。
- Stage 4：已纳入 W3C 标准 - 这些特性已经成为 W3C CSS 标准的一部分，已经得到了广泛支持。开发者可以放心在生产环境中使用这些特性。

#### cssnano

这是一个使用率非常高的插件，因为该插件做的事情是对 CSS 进行一个压缩。

- cssnano 是否需要传入配置
  - 理论上来讲，是不需要的，因为 cssnano 默认的预设就已经非常好了，一般我们不需要做其他的配置
  - cssnano 本身又是由一些其他的插件组成的
    - postcss-discard-comments：删除 CSS 中的注释。
    - postcss-discard-duplicates：删除 CSS 中的重复规则。
    - postcss-discard-empty：删除空的规则、媒体查询和声明。
    - postcss-discard-overridden：删除被后来的相同规则覆盖的无效规则。
    - postcss-normalize-url：优化和缩短 URL。
    - postcss-minify-font-values：最小化字体属性值。
    - postcss-minify-gradients：最小化渐变表示。
    - postcss-minify-params：最小化@规则的参数。
    - postcss-minify-selectors：最小化选择器。
    - postcss-normalize-charset：确保只有一个有效的字符集 @规则。
    - postcss-normalize-display-values：规范化 display 属性值。
    - postcss-normalize-positions：规范化背景位置属性。
    - postcss-normalize-repeat-style：规范化背景重复样式。
    - postcss-normalize-string：规范化引号。
    - postcss-normalize-timing-functions：规范化时间函数。
    - postcss-normalize-unicode：规范化 unicode-range 描述符。
    - postcss-normalize-whitespace：规范化空白字符。
    - postcss-ordered-values：规范化属性值的顺序。
    - postcss-reduce-initial：将初始值替换为更短的等效值。
    - postcss-reduce-transforms：减少变换属性中的冗余值。
    - postcss-svgo：优化和压缩内联 SVG。
    - postcss-unique-selectors：删除重复的选择器。
    - postcss-zindex：重新计算 z-index 值，以减小文件大小。

```shell
pnpm add cssnano -D
```

```typescript
import cssnano from 'cssnano'
```

![20240712133941](https://tuchuang.coder-sunshine.top/images/20240712133941.png)

执行代码发现 css 已经被压缩了

![20240712134005](https://tuchuang.coder-sunshine.top/images/20240712134005.png)

也可以加配置项

```typescript
const plugins: AcceptedPlugin[] = [
  autoprefixer(browserList),
  postcssPresetEnv({
    stage: 0
  }),
  cssnano({
    preset: [
      'default',
      {
        discardComments: false, // 删除 CSS 中的注释
        discardEmpty: false
      }
    ]
  })
]
```

![20240712134036](https://tuchuang.coder-sunshine.top/images/20240712134036.png)

这样 css 注释就被保存下来了

![20240712134051](https://tuchuang.coder-sunshine.top/images/20240712134051.png)

**接下来用另外一种配置方式，就是工程中常用的配置方式**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    require('autoprefixer'),
    require('postcss-preset-env')({
      stage: 0
    })
    // require('cssnano')({
    //   preset: [
    //     'default',
    //     {
    //       discardComments: true, // 删除注释
    //     },
    //   ],
    // }),
  ]
}

module.exports = config
```

![20240712134123](https://tuchuang.coder-sunshine.top/images/20240712134123.png)

为了看得清楚，暂时注释压缩，压缩通常放在最后一个执行

#### postcss-import

该插件主要用于处理 CSS 文件中 @import 规则。在原生的 CSS 中，存在 @import，可以引入其他的 CSS 文件，但是在引入的时候会存在一个问题，就是客户端在解析 CSS 文件时，发现有 @import 就会发送 HTTP 请求去获取对应的 CSS 文件。

```css
body {
  margin: 200px !important;
}
```

```css
@import './index2.css';

@custom-selector :--heading h1, h2, h3, h4, h5, h6;

/* 这是一个注释 */
.flex {
  display: flex;
  /* font-size: 200px; */
}

:--heading {
  margin-top: 20px;

  display: flex;
  position: absolute;
  left: 0;
}
```

![20240712134154](https://tuchuang.coder-sunshine.top/images/20240712134154.png)

打开配置，重新打包

![20240712134223](https://tuchuang.coder-sunshine.top/images/20240712134223.png)

#### purgecss

该插件专门用于移除没有使用到的 CSS 样式的工具，相当于是 CSS 版本的 tree shaking（树摇），它会找到你文件中实际使用的 CSS 类名，并且移除没有使用到的样式，这样可以有效的减少 CSS 文件的大小，提升传输速度。

```shell
pnpm add @fullhuman/postcss-purgecss -D
```

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <link rel="stylesheet" href="../dist/build.css" />
  </head>
  <body>
    <div class="test">123</div>
  </body>
</html>
```

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    require('postcss-import'),
    require('@fullhuman/postcss-purgecss')({
      content: ['./src/**/*.html'] // 以html为参照
    }),
    require('autoprefixer'),
    require('postcss-preset-env')({
      stage: 0
    })
    // require('cssnano')({
    //   preset: [
    //     'default',
    //     {
    //       discardComments: true, // 删除注释
    //     },
    //   ],
    // }),
  ]
}

module.exports = config
```

打包之前的 css，可以发现只有 body 样式了

![20240712134251](https://tuchuang.coder-sunshine.top/images/20240712134251.png)

还有一个配置也很重要。

![20240712134312](https://tuchuang.coder-sunshine.top/images/20240712134312.png)

表示以 active- 开头的类名都不需要树摇，还可以写入一些 hover 啥的等

![20240712134338](https://tuchuang.coder-sunshine.top/images/20240712134338.png)

### 自定义插件

PostCSS 官网，介绍了如何去编写一个自定义插件：[https://postcss.org/docs/writing-a-postcss-plugin](https://postcss.org/docs/writing-a-postcss-plugin) ![20240712134419](https://tuchuang.coder-sunshine.top/images/20240712134419.png) ![20240712134432](https://tuchuang.coder-sunshine.top/images/20240712134432.png) 写一个 将 颜色转化为 16 进制 的插件

```typescript
import { AcceptedPlugin } from 'postcss'
import Color from 'color'

// 定义插件的参数
interface Options {
  test?: string
}

export default (opt?: Options): AcceptedPlugin => {
  console.log('opt', opt)
  return {
    postcssPlugin: 'convertColorsToHex',
    Declaration(decl) {
      // 先创建一个正则表达式，提取出如下的声明
      // 因为如下的声明对应的值一般都是颜色值
      const colorRegex = /(^color)|(^background(-color)?)/
      if (colorRegex.test(decl.prop)) {
        console.log('decl.prop', decl.prop)
        try {
          // 将颜色值转为 Color 对象，因为这个 Color 对象对应了一系列的方法
          // 方便我们进行转换
          const color = Color(decl.value)
          console.log('color', color)
          // 将颜色值转换为十六进制
          const hex = color.hex()
          console.log('hex', hex)
          // 更新属性值
          decl.value = hex
        } catch (err: any) {
          console.error(`[convertColorsToHex] Error processing ${decl.prop}: ${err.message}`)
        }
      }
    }
  }
}
```

也可以写成 cjs 格式，项目中用了 ts，可以直接将 配置 写到 vite 中去，这样就可以 使用 esm 了

```typescript
import { ConfigEnv, UserConfig, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import postcssPresetEnv from 'postcss-preset-env'
import myPlugin from './src/plugins/myPlugin'

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  return {
    plugins: [vue()],
    css: {
      postcss: {
        plugins: [
          postcssPresetEnv({
            stage: 0
          }),
          myPlugin({
            test: '传递的参数信息'
          })
        ]
      }
    }
  }
})
```
