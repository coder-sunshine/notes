import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: '秘密の花园',
  description: '学习足迹',
  head: [['link', { rel: 'icon', href: '/notes/logo.svg' }]],
  base: '/notes/', // 基础路径，必须以 / 开头结尾
  markdown: {
    theme: {
      light: 'catppuccin-latte',
      dark: 'catppuccin-mocha',
    },
    lineNumbers: true,
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    outline: {
      label: '文章目录',
      level: [2, 6],
    },

    logo: 'logo.svg', // 配置logo位置，public目录

    nav: [
      { text: '首页', link: '/' },
      {
        text: '前端',
        items: [
          { text: 'Vue3源码', link: '/docs/frontend/vue3-core/docs/index.md' },
          {
            text: 'React',
            link: '/docs/frontend/react/hook-test/index.md',
          },
          { text: '工程化', link: '/docs/frontend/engineering/rollup/quick-start/index.md' },
        ],
      },
    ],

    sidebar: {
      '/docs/frontend/react': [
        {
          text: '常用Hooks',
          link: '/docs/frontend/react/hook-test/index.md',
        },
        {
          text: 'Hook 的闭包陷阱的成因和解决方案',
          link: '/docs/frontend/react/closure-trap/index.md',
        },
      ],
      '/docs/frontend/engineering': [
        {
          text: 'Rollup',
          items: [
            { text: '快速开始', link: '/docs/frontend/engineering/rollup/quick-start/index.md' },
            { text: '常用配置', link: '/docs/frontend/engineering/rollup/common-config/index.md' },
          ],
        },
        {
          text: 'Postcss',
          items: [{ text: '简介与配置', link: '/docs/frontend/engineering/postcss/index.md' }],
        },
      ],
      '/docs/frontend/vue3-core': [
        {
          text: '设计思想',
          link: '/docs/frontend/vue3-core/docs/index.md',
        },
        {
          text: '环境搭建',
          link: '/docs/frontend/vue3-core/docs/environment-setup.md',
        },
        {
          text: '响应式原理',
          link: '/docs/frontend/vue3-core/docs/reactivity.md',
        },
        {
          text: '运行时',
          link: '/docs/frontend/vue3-core/docs/runtime.md'
        }
      ],
    },

    // 页脚
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    // 只有传到github才有用，读取的是文件修改时间
    lastUpdated: {
      text: '最后更改时间',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'short',
      },
    },

    // 搜索
    search: {
      provider: 'local',
    },

    //固定的几个模式 youtube tuiteer bilibili
    socialLinks: [{ icon: 'github', link: 'https://github.com/coder-sunshine' }],
  },
})
