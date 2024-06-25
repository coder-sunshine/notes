import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: '秘密の花园',
  description: '学习足迹',
  head: [['link', { rel: 'icon', href: '/notes/logo.svg' }]],
  base: '/notes/', // 基础路径，必须以 / 开头结尾
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    outline: {
      label: '文章目录'
    },

    logo: "logo.svg", // 配置logo位置，public目录

    nav: [
      { text: '首页', link: '/' },
      { text: '前端工程化', link: '/docs/frontend/engineering/rollup/quick-start.md' }
    ],

    sidebar: [
      {
        text: 'Rollup',
        items: [
          { text: '快速开始', link: '/docs/frontend/engineering/rollup/quick-start.md' },
          { text: '常用配置', link: '/docs/frontend/engineering/rollup/common-config.md' }
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
