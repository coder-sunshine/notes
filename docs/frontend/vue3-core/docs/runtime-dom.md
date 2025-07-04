# runtime-dom

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

##### 3. patchEvent

```js
const vNode = h(
  'div',
  {
    class: 'aaa',
    style: {
      // color: 'red',
      backgroundColor: 'red',
    },
    onClick: () => {
      console.log('click vNode1')
    },
  },
  'node1'
)

const vNode2 = h(
  'div',
  {
    class: 'bbb',
    style: {
      color: 'blue',
    },
    onClick: () => {
      console.log('click vNode2')
    },
  },
  'node2'
)
```

```ts
export function patchEvent(el, rawName, prevValue, nextValue) {
  const name = rawName.slice(2).toLowerCase()
  // 之前有的去掉
  if (prevValue) {
    el.removeEventListener(name, prevValue)
  }

  // 新的加上
  el.addEventListener(name, nextValue)
}
```

![20250630143432](https://tuchuang.coder-sunshine.top/images/20250630143432.png)

![20250630143441](https://tuchuang.coder-sunshine.top/images/20250630143441.png)

把之前有的去掉，再把新的设置上去就行了。但是这样会有一定的效率问题。

> [!WARNING] 问题
> 如果我们一直是在操作某一个事件，例如 `click` 事件，那么如果事件更新的话，就需要一直去掉，重新设置等处理。既然都是同一个事件，只是调用不同的处理函数，那么只需要改变这一个函数就行了，**可以不直接绑定用户传递的事件函数，而是将事件绑定到一个对象的属性中，每次更新的时候，只需要更新这个对象的属性，就可以轻松的完成事件换绑**

创建一个事件处理函数 `createInvoker` ，内部调用 `nextValue`

```ts
function createInvoker(fn) {
  const invoker = e => {
    invoker.value(e)
  }
  invoker.value = fn
  // 返回 invoker 函数，这个函数内部调用 fn 函数
  return invoker
}

export function patchEvent(el, rawName, prevValue, nextValue) {
  const name = rawName.slice(2).toLowerCase()

  // 之前有的去掉
  if (prevValue) {
    el.removeEventListener(name, prevValue)
  }

  const invoker = createInvoker(nextValue)

  // 将 invoker 绑定到 el 上
  el.addEventListener(name, invoker)
}
```

下一次进来的时候拿到之前创建的 `invoker`，然后更改 `invoker.value` 就行了，但是这里目前是拿不到之前的 `invoker`，因为每次进来都重新创建了一个 `invoker`。可以将这个 `invoker` 保存到 `el` 上面。

```ts{1,6}
const veiKey = Symbol('_vei')

export function patchEvent(el, rawName, prevValue, nextValue) {
  const name = rawName.slice(2).toLowerCase()
  // 有就获取，没有就是 空对象
  const invokers = (el[veiKey] ??= {})

  const existingInvoker = invokers[rawName]

  // 如果之前有,则更新 invoker.value
  if (existingInvoker) {
    // 如果之前绑定了，那就更新 invoker.value 完成事件换绑
    existingInvoker.value = nextValue
    return
  }

  // 创建 invoker 函数
  const invoker = createInvoker(nextValue)

  // 将 invoker 保存到 el 上
  invokers[rawName] = invoker

  // 将 invoker 绑定到 el 上
  el.addEventListener(name, invoker)
}
```

![20250630152319](https://tuchuang.coder-sunshine.top/images/20250630152319.png)

测试一下，效果是一样的。

**还需要改一下，如果 nextValue 有，才需要去换绑等操作。如果新的事件没有，老的有，则需要移除事件。**

- 最终代码, prevValue 也不需要传

```ts
function createInvoker(fn) {
  const invoker = e => {
    invoker.value(e)
  }
  invoker.value = fn
  // 返回 invoker 函数，这个函数内部调用 fn 函数
  return invoker
}

const veiKey = Symbol('_vei')

/**
 * const fn1 = () => { console.log('更新之前的') }
 * const fn2 = () => { console.log('更新之后的') }
 * click el.addEventListener('click', (e) => { fn2(e) })
 */
export function patchEvent(el, rawName, nextValue) {
  const name = rawName.slice(2).toLowerCase()
  // 有就获取，没有就是 空对象
  const invokers = (el[veiKey] ??= {})

  const existingInvoker = invokers[rawName]

  if (nextValue) {
    // 如果之前有,则更新 invoker.value
    if (existingInvoker) {
      // 如果之前绑定了，那就更新 invoker.value 完成事件换绑
      existingInvoker.value = nextValue
      return
    }

    // 创建 invoker 函数
    const invoker = createInvoker(nextValue)

    // 将 invoker 保存到 el 上
    invokers[rawName] = invoker

    // 将 invoker 绑定到 el 上
    el.addEventListener(name, invoker)
  } else {
    /**
     * 如果新的事件没有，老的有，就移除事件
     */
    if (existingInvoker) {
      // 移除事件监听
      el.removeEventListener(name, existingInvoker)
      // 移除 invokers 上的事件
      invokers[rawName] = undefined
    }
  }
}
```

##### 4. patchAttr

```js{4,20}
const vNode = h(
  'div',
  {
    id: 'node1',
    class: 'aaa',
    style: {
      // color: 'red',
      backgroundColor: 'red',
    },
    onClick: () => {
      console.log('click vNode1')
    },
  },
  'node1'
)

const vNode2 = h(
  'div',
  {
    id: 'node2',
    class: 'bbb',
    style: {
      color: 'blue',
    },
    // onClick: () => {
    //   console.log('click vNode2')
    // },
  },
  'node2'
)
```

`patchAttr` 很简单，有值就`更新`，没值就 `remove` 就行了

```ts
export function patchAttr(el, key, value) {
  if (value == undefined) {
    // null undefined 那就理解为要移除
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
```

![20250630153812](https://tuchuang.coder-sunshine.top/images/20250630153812.png)

```ts
// runtime-dom/src/index.ts

import { isOn } from '@vue/shared'
import { patchClass } from './modules/patchClass'
import { patchStyle } from './modules/patchStyle'
import { patchEvent } from './modules/patchEvent'
import { patchAttr } from './modules/patchAttr'

/**
 * 1. class
 * 2. style
 * 3. event
 * 4. attr
 */
export function patchProp(el, key, prevValue, nextValue) {
  if (key === 'class') {
    return patchClass(el, nextValue)
  }

  if (key === 'style') {
    return patchStyle(el, prevValue, nextValue)
  }

  if (isOn(key)) {
    return patchEvent(el, key, nextValue)
  }

  patchAttr(el, key, nextValue)
}
```

#### 3. runtime-dom 的职责

`runtime-dom` 的使命就是提供浏览器内置的 `DOM` 操作 `API`，并且它会根据 `runtime-core` 提供的 `createRenderer` 函数，创建一个渲染器，当然这个渲染器需要用到 `DOM` 操作的 `API`，所以只需要调用 `createRenderer` **（这个模块目前还是用的从 vue官方 导入的）** 将 `nodeOps` 和 `patchProp` 传递过去即可
