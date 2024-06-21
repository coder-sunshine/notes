import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "My Awesome Project",
  description: "A VitePress Site",
  outDir: "docs", //打包输出的目录
  base: "/docs/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home导航', link: '/' },
      { text: 'Examples导航', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown 左侧', link: '/markdown-examples' },
          { text: 'Runtime API 左侧', link: '/api-examples' }
        ]
      }
    ],
    //修改页脚
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated:{
       text: '最后更改时间',
       formatOptions: {
         dateStyle: 'full',
         timeStyle: 'short'
       }
    },
    //搜索
    search:{
       provider:'local'
    },

    //固定的几个模式 youtube tuitter
    socialLinks: [
      { icon: 'facebook', link: 'https://facebook.com' },
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
