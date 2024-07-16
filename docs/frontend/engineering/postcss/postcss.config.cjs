/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [
    require('postcss-import'),
    require('@fullhuman/postcss-purgecss')({
      content: ['./**/*.html'], // 以html为参照
      safelist: [/^active-/]
    }),
    require('autoprefixer'),
    require('postcss-preset-env')({
      stage: 0
    })
    // require('cssnano')({
    //   preset: [
    //     'default',
    //     {
    //       discardComments: true // 删除注释
    //     }
    //   ]
    // })
  ]
}

module.exports = config
