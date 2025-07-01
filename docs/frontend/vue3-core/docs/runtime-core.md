# runtime-core

## 核心运行时

### 虚拟 DOM 如何创建？

在 `vue` 中，我们会使用 `h` 和 `createVNode` 这两个函数来创建**虚拟节点**，那么既然都是**创建虚拟节点**，为什么还需要两个函数呢？

实际上真正创建虚拟节点的是后面的 `createVNode` 这个函数，而我们常用的 `h` 函数，只是对 `createVNode` 的参数进行了一个封装，更加方便我们的使用而已，因为我们在使用 `h` 函数的时候，会存在多种场景，根据使用习惯总结了大概以下几种比如：

```js
/**
 * h 函数的使用方法：
 * 1. h('div', 'hello world') 第二个参数为 子节点
 * 2. h('div', [h('span', 'hello'), h('span', ' world')]) 第二个参数为 子节点
 * 3. h('div', h('span', 'hello')) 第二个参数为 子节点
 * 4. h('div', { class: 'container' }) 第二个参数是 props
 * ------
 * 5. h('div', { class: 'container' }, 'hello world') 第二个参数是 props，第三个参数为 子节点
 * 6. h('div', { class: 'container' }, h('span', 'hello world')) 第二个参数是 props，第三个参数为 子节点
 * 7. h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world')) 第二个参数是 props，第三个参数为 子节点
 * 8. h('div', { class: 'container' },[h('span', 'hello'), h('span', 'world')]) 和 7 一个意思
 */
```

```js
// 使用官方的 render 方法
import { render } from '../../../node_modules/vue/dist/vue.esm-browser.js'

import { h } from '../dist/vue.esm.js'

/**
 * h 函数的使用方法：
 * 1. h('div', 'hello world') 第二个参数为 子节点
 * 2. h('div', [h('span', 'hello'), h('span', ' world')]) 第二个参数为 子节点
 * 3. h('div', h('span', 'hello')) 第二个参数为 子节点
 * 4. h('div', { class: 'container' }) 第二个参数是 props
 * ------
 * 5. h('div', { class: 'container' }, 'hello world') 第二个参数是 props，第三个参数为 子节点
 * 6. h('div', { class: 'container' }, h('span', 'hello world')) 第二个参数是 props，第三个参数为 子节点
 * 7. h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world')) 第二个参数是 props，第三个参数为 子节点
 * 8. h('div', { class: 'container' },[h('span', 'hello'), h('span', 'world')]) 和 7 一个意思
 */

const vnode = h('div', 'hello world')

render(vNode, app)
```

接下来实现 h 函数

```ts
// runtime-core/src/h.ts

import { isArray, isObject } from '@vue/shared'

/**
 * h 函数，主要的作用是对 createVNode 做一个参数标准化（归一化）
 */
export function h(type, propsOrChildren?, children?) {
  // 根据参数的长度先做判断，
  const l = arguments.length

  if (l === 2) {
    // 长度为 2 第二个参数，有可能是 props, 也有可能是 children
    // 判断第二个参数是否是数组
    if (isArray(propsOrChildren)) {
      // h('div', [h('span', 'hello'), h('span', ' world')])
      return createVNode(type, null, propsOrChildren)
    }

    // 如果第二个参数是对象，则有可能是 props 或者是 一个虚拟节点（虚拟DOM就是对象）
    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // h('div', h('span', 'hello'))
        return createVNode(type, null, [propsOrChildren])
      } else {
        // h('div', { class: 'container' })
        return createVNode(type, propsOrChildren, null)
      }
    }

    // h('div', 'hello world') 第三个参数是字符串,字符串直接传就行了，其他的需要包装成数组
    return createVNode(type, null, propsOrChildren)
  } else {
    if (l > 3) {
      /**
       * h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world'))
       * 转换成
       * h('div', { class: 'container' }, [h('span', 'hello'), h('span', 'world')])
       */
      // 从第三个开始截取，合并成一个数组
      children = [...arguments].slice(2)
    } else if (isVNode(children)) {
      // h('div', { class: 'container' }, h('span', 'hello world'))
      // createVNode第三个参数不是字符串就是数组
      children = [children]
    }

    // 要是只传了 type,就只渲染一个type就行了，例如 div
    return createVNode(type, propsOrChildren, children)
  }
}

/**
 * 判断是不是一个虚拟节点，根据 __v_isVNode 属性
 * @param value
 */
function isVNode(value) {
  return value?.__v_isVNode
}

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
export function createVNode(type, props?, children?) {
  const vnode = {
    // 证明是一个虚拟DOM
    __v_isVNode: true,
    type,
    props,
    // 做 diff 算法
    key: props?.key,
    children,
    // 虚拟节点要挂载的元素
    el: null,
  }

  return vnode
}
```

主要就是对上面的各种情况处理。`h` 函数主要就是做参数归一化，由 `createVNode` 来创建虚拟节点

> [!TIP] 注意
> `createVNode` 的**第三个参数**需要 如果是 字符串就传字符串，**其他情况都需要传个数组才行**

![20250630171355](https://tuchuang.coder-sunshine.top/images/20250630171355.png)

目前渲染不出来，说是无法识别的类型，识别不出来div,是因为 vnode 少传了一个属性，`shapeFlag`，我们先写死一个 9 试试。

#### shapeFlag

```ts
const vnode = {
  // 证明是一个虚拟DOM
  __v_isVNode: true,
  type,
  props,
  // 做 diff 算法
  key: props?.key,
  children,
  // 虚拟节点要挂载的元素
  el: null,
  shapeFlag: 9, // [!code ++]
}
```

![20250630171522](https://tuchuang.coder-sunshine.top/images/20250630171522.png)

> [!TIP] shapeFlag 是什么?
> `shapeFlag` 就是一个标识，在 `shapeFlag` 中，如果某一位的值是 1，就表示它是一个 `DOM`，或者某一位是 1，就表示它的子节点是一个文本，这样我们就可以在一个属性中通过这种组合的方式，表示更多的信息。

把官方的 shapeFlags 直接复制过来

```ts
export enum ShapeFlags {
  // 表示 DOM 元素
  ELEMENT = 1,
  // 表示函数组件
  FUNCTIONAL_COMPONENT = 1 << 1,
  // 表示有状态组件（带有状态、生命周期等）
  STATEFUL_COMPONENT = 1 << 2,
  // 表示该节点的子节点是纯文本
  TEXT_CHILDREN = 1 << 3,
  // 表示该节点的子节点是数组形式（多个子节点）
  ARRAY_CHILDREN = 1 << 4,
  // 表示该节点的子节点是通过插槽（slots）传入的
  SLOTS_CHILDREN = 1 << 5,
  // 表示 Teleport 组件，用于将子节点传送到其他位置
  TELEPORT = 1 << 6,
  // 表示 Suspense 组件，用于处理异步加载组件时显示备用内容
  SUSPENSE = 1 << 7,
  // 表示该组件应当被 keep-alive（缓存）
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8,
  // 表示该组件已经被 keep-alive（已缓存）
  COMPONENT_KEPT_ALIVE = 1 << 9,
  // 表示组件类型，有状态组件与无状态函数组件的组合
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT,
}
```

写一个测试的 vnode

```ts
let shapeFlag = 0

const vnode = {
  __v_isVNode: true,
  type: 'div',
  children: 'hello world',
  shapeFlag,
}

// 如果是一个dom元素，例如 div p 等
if (typeof vnode.type === 'string') {
  shapeFlag = ShapeFlags.ELEMENT // 1
}

// 如果 children 是一个 string
if (typeof vnode.children === 'string') {
  /**
   * 或运算
   * 0001
   * 1000
   * 1001
   */
  shapeFlag = shapeFlag | ShapeFlags.TEXT_CHILDREN // 1001
}

// 如果 children 是一个数组
if (isArray(vnode.children)) {
  shapeFlag = shapeFlag | ShapeFlags.ARRAY_CHILDREN // 10000
}

vnode.shapeFlag = shapeFlag

if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
  /**
   * 与运算
   * 1001
   * 0001
   * 0001
   */
  console.log('是一个 dom 元素')
}

if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
  /**
   * 与运算 两个相同的位置，都是1，就是1
   * 1001
   * 1000
   * 1000
   */
  console.log('子元素是一个纯文本节点')
}

if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
  /**
   * 与运算
   * 01001
   * 10000
   * 00000
   */
  console.log('子元素是一个数组')
}
```

![20250701105116](https://tuchuang.coder-sunshine.top/images/20250701105116.png)

```ts
const vnode = {
  __v_isVNode: true,
  type: 'div',
  children: [h('span', 'hello'), h('span', ' world')],
  shapeFlag,
}
```

![20250701105138](https://tuchuang.coder-sunshine.top/images/20250701105138.png)

> [!IMPORTANT] 总结
> 通过 `shapeFlag` 的各种组合，或运算，与运算等操作后，就可以知道该虚拟节点是一个什么类型的了

将 `isVNode` 和 `createVNode` 方法抽离到 runtime-core/src/vnode.ts

```ts
// runtime-core/src/vnode.ts

import { isArray, isString, ShapeFlags } from '@vue/shared'

/**
 * 判断是不是一个虚拟节点，根据 __v_isVNode 属性
 * @param value
 */
export function isVNode(value) {
  return value?.__v_isVNode
}

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
export function createVNode(type, props?, children?) {
  let shapeFlag

  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  }

  if (isString(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  const vnode = {
    // 证明是一个虚拟DOM
    __v_isVNode: true,
    type,
    props,
    // 做 diff 算法
    key: props?.key,
    children,
    // 虚拟节点要挂载的元素
    el: null,
    shapeFlag,
  }

  return vnode
}
```

暂时只处理上面几种情况
