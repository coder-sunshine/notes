import fs from 'node:fs'
import path from 'node:path'
import postcss, { type AcceptedPlugin } from 'postcss'
import autoprefixer from 'autoprefixer'
import postcssPresetEnv from 'postcss-preset-env'
import cssnano from 'cssnano'

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

postcss(plugins)
  .process(css, { from: undefined })
  .then(result => {
    console.log(result.css)
  })
