# 运行时

## 浏览器运行时

### 虚拟 dom 的概念

虚拟 `DOM` 其实就是用 `js` 对象来描述一个 `DOM`，`Vue` 最终会根据这个虚拟 `DOM` 创建出一个真实的 `DOM` 挂载到我们的页面上，那么虚拟 DOM 是什么样的？又是怎么创建的呢？

在 `vue` 中一般会通过 `h` 函数创建 虚拟 `DOM`

```ts
const vNode = h('div', 'hello world')
```

这样就创建了一个虚拟 `DOM`，这个虚拟 `DOM` 是一个 `div` 元素，它的内容是 `hello world`，那么它是如何渲染到页面上的呢？这里我们就不得不说一下**渲染器了，`vue` 是通过一个渲染器，将虚拟节点转换为真实节点。**

### 渲染器

渲染器由 runtime-dom 这个模块提供。

```ts
import { render, h } from 'vue'

// 创建一个虚拟 DOM
const vNode = h('div', 'hello world')

// 将虚拟 DOM 渲染到 id 为 app 的元素中
render(vNode, document.querySelector('#app'))
```

### 整体架构

vue 的渲染器主要负责将虚拟 DOM 转换为 真实 DOM, 核心包含以下几个部分

1. `renderOptions`：渲染器配置项，包含所有 DOM 操作的方法
2. `nodeOps`：封装了原生 DOM API
3. `patchProp`：负责处理元素属性的更新

#### 1. 节点操作

由于虚拟 dom 可以跨平台，所以我们不会在运行时直接操作 dom，针对节点操作，**更倾向于各个平台自助传递节点操作的 API**，当然 runtime-dom 是 vue 内部提供的浏览器 DOM 操作 API，如果是其平台，由框架设计者自由封装
`nodeOps` 封装了所有 DOM 节点的基础操作，包括：

- insert：插入节点
- createElement：创建元素
- remove：移除元素
- setElementText：设置元素文本内容
- createText：创建文本节点
- setText：设置节点文本
- parentNode：获取父节点
- nextSibling：获取下一个兄弟节点
- querySelector：DOM 查询

```ts
// runtime-dom/src/nodeOps.ts

/**
 * 封装 dom 节点操作的 API
 */
export const nodeOps = {
  // 插入节点
  insert(el, parent, anchor) {
    // insertBefore 如果第二个参数为 null，那它就等于 appendChild
    parent.insertBefore(el, anchor || null)
  },
  // 创建元素
  createElement(type) {
    return document.createElement(type)
  },
  // 移除元素
  remove(el) {
    const parentNode = el.parentNode
    if (parentNode) {
      parentNode.removeChild(el)
    }
  },
  // 设置元素的 text
  setElementText(el, text) {
    el.textContent = text
  },
  // 创建文本节点
  createText(text) {
    return document.createTextNode(text)
  },
  // 设置 nodeValue
  setText(node, text) {
    return (node.nodeValue = text)
  },
  // 获取到父节点
  parentNode(el) {
    return el.parentNode
  },
  // 获取到下一个兄弟节点
  nextSibling(el) {
    return el.nextSibling
  },
  // dom 查询
  querySelector(selector) {
    return document.querySelector(selector)
  },
}
```

```html
<body>
  <div id="app"></div>

  <script type="module">
    import { h, createRenderer } from '../../../node_modules/vue/dist/vue.esm-browser.js'

    import { nodeOps } from '../dist/vue.esm.js'

    const vNode = h('div', 'hello word')

    const renderer = createRenderer(nodeOps)

    console.log(renderer)

    renderer.render(vNode, app)
  </script>
</body>
```

这里先使用 vue 导出的 h 函数 和 自定义渲染器 API,导入上面的节点操作的代码。

![20250624163712](https://tuchuang.coder-sunshine.top/images/20250624163712.png)

这样 **vue 通过渲染器，将虚拟节点，转换成真实 DOM** ，最终就渲染到页面上了

- 代码结构
  1. `reactive` 导出了响应式核心
  2. `runtime-core` 导出了响应式模块 reactive
  3. `runtime-dom` 依赖 runtime-core
  4. `vue` 导出了 runtime-dom

![20250624164228](https://tuchuang.coder-sunshine.top/images/20250624164228.png)

#### 2. 属性更新 patchProp

![20250630132621](https://tuchuang.coder-sunshine.top/images/20250630132621.png)

属性更新大致分为**四种情况**

- class
- style
- event
- attr

##### 1. patchClass

- runtime-dom/src/patchProp

```ts
export function patchProp(el, key, prevValue, nextValue) {
  console.log('el', el)
  console.log('key', key)
  console.log('prevValue', prevValue)
  console.log('nextValue', nextValue)
}
```

在 index.ts 中将 createRenderer 需要的统一导出

```ts{6,8}
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

export * from '@vue/runtime-core'

const renderOptions = { patchProp, ...nodeOps }

export { renderOptions }
```

```js
import { h, createRenderer } from '../../../node_modules/vue/dist/vue.esm-browser.js'

import { renderOptions } from '../dist/vue.esm.js'

const vNode = h('div', { class: 'aaa' }, 'hello word')

const renderer = createRenderer(renderOptions)

const vNode2 = h('div', { class: 'bbb' }, 'hello word')

renderer.render(vNode, app)

setTimeout(() => {
  // 替换 vNode 为 vNode2
  renderer.render(vNode2, app)
}, 1000)
```

![20250630135028](https://tuchuang.coder-sunshine.top/images/20250630135028.png)

可以看到 **对应的参数值**，处理对应的值就行了。

> [!TIP] class 分为两种情况
> `nextValue` 有值，直接替换 `className` 就行。
>
> `nextValue` 没值，移除 `className`。

```ts{5}
// runtime-dom/src/patchProp.ts

export function patchClass(el, value) {
  // 如果新值没有值，则是要移除 class
  // 用双等判断 null 也移除
  if (value == undefined) {
    el.removeAttribute('class')
  } else {
    // 如果新值有值，则设置 class
    el.className = value
  }
}
```

![20250630135711](https://tuchuang.coder-sunshine.top/images/20250630135711.png)

这个时候 `class` 就从 `aaa` 转化为 `bbb`

如果把 `vNode2` 变成 `const vNode2 = h('div', 'hello word')`

![20250630135844](https://tuchuang.coder-sunshine.top/images/20250630135844.png)

`class` 就从 `aaa` 变没有了

##### 2. patchStyle

```js
const vNode = h(
  'div',
  {
    class: 'aaa',
    style: {
      color: 'red',
    },
  },
  'hello word'
)

const vNode2 = h(
  'div',
  {
    class: 'bbb',
    style: {
      color: 'blue',
    },
  },
  'hello word'
)
```

把 `color` 从红色变成 蓝色。

首先，肯定是把 `nextValue` 全部设置到 `style` 上面

```ts
export function patchStyle(el, prevValue, nextValue) {
  const style = el.style

  // 如果新值有值，则全部设置上去
  if (nextValue) {
    for (const key in nextValue) {
      /**
       * 把新的样式全部生效，设置到 style 中
       */
      style[key] = nextValue[key]
    }
  }
}
```

![20250630141640](https://tuchuang.coder-sunshine.top/images/20250630141640.png)

这样字体变蓝色。

```js{7,18}
const vNode = h(
  'div',
  {
    class: 'aaa',
    style: {
      // color: 'red',
      backgroundColor: 'red',
    },
  },
  'hello word'
)

const vNode2 = h(
  'div',
  {
    class: 'bbb',
    style: {
      color: 'blue',
    },
  },
  'hello word'
)
```

还需要把之前有的，现在没有的删掉。

```ts
export function patchStyle(el, prevValue, nextValue) {
  const style = el.style

  // 如果新值有值，则全部设置上去
  if (nextValue) {
    for (const key in nextValue) {
      /**
       * 把新的样式全部生效，设置到 style 中
       */
      style[key] = nextValue[key]
    }
  }

  if (prevValue) {
    for (const key in prevValue) {
      /**
       * 把之前有的，但是现在没有的，给它删掉
       * 之前是 { background:'red' } => { color:'blue' } 就要把 backgroundColor 删掉，把 color 应用上
       */
      if (!(key in nextValue)) {
        style[key] = null
      }
    }
  }
}
```

![20250630142010](https://tuchuang.coder-sunshine.top/images/20250630142010.png)

![20250630142016](https://tuchuang.coder-sunshine.top/images/20250630142016.png)
