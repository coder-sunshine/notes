import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: '秘密の花园',
  description: '学习足迹',
  outDir: 'docs', // 打包输出的目录
  base: '/notes/', // 基础路径
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '前端工程化', link: '/frontend/engineering/rollup/quickstart.md' }
    ],

    sidebar: [
      {
        text: 'Rollup',
        items: [
          { text: '快速开始', link: '/frontend/engineering/rollup/quickstart.md' },
          { text: '常用配置', link: '/frontend/engineering/rollup/common-config.md' }
        ]
      }
    ],

    // 页脚
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    // 只有传到github才有用，读取的是文件修改时间
    lastUpdated: {
      text: '最后更改时间',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'short'
      }
    },

    // 搜索
    search: {
      provider: 'local'
    },

    //固定的几个模式 youtube tuiteer bilibili
    socialLinks: [{ icon: 'github', link: 'https://github.com/coder-sunshine' }]
  }
})
