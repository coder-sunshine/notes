### postCss

babel 提供过程 @babel/preset-env  es6-es5
`JavaScript`
AST -> transform -> generate(生成)

```js
const a = () => 213
```

if(kind === 'const') {
    return 'var'
}

```js
var a = function () {
    return 123
}
```

=> if(=>) function

css界的babel

postCss 提供一个过程
`css`

AST 思想 ts->js 就用了AST vue也用了 V8引擎也用了
Vue跨平台通过渲染器createRenderer

AST -> transform -> generate

autoprefixer 这个东西就是帮你们实现兼容各个浏览器加前缀的
并且是基于Postcss 实现的

postcss 可以配合vite webpack一起使用
postcss-loader vite自带了postcss
```css
.flex {
   :deep(.x)  {
        display:flex
    }
}
```

默认情况 是放在第一个位置的
[data-v-asdsad] .flex .x {

}
变成这样
 .flex [data-v-asdsad] .x {

}
