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
export function h(type, propsOrChildren?, children) {
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
export function createVNode(type, props?, children = null) {
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

**使用权限组合举个例子**

```js
const READ = 1 // 0001
const WRITE = 1 << 1 // 0010
const UPDATE = 1 << 2 // 0100
const DELETE = 1 << 3 // 1000

// 权限组合 --> 使用 或运算
// 如果需要可读，可写，可删除权限，那么就只需要把对应的位置设置成1就行了，也就是 1011

// 也就是想要什么权限，就直接使用 或运算 计算就行了
const permission1 = READ | WRITE | DELETE
/**
 * 0001
 * 0010
 * 1000
 * -------
 * 只要一个位置为1，那么结果就为1
 * 1011
 */

console.log(permission1.toString(2)) // 1011

// 权限判断 --> 使用与运算
// 判断 permission1 是否有可删除权限
const res1 = permission1 & DELETE
/**
 * 1011
 * 1000
 * -------
 * 所有位置都为1，结果为1，否则为0
 * 1000
 */
console.log(res1.toString(2)) // 1000

// 权限删除 --> 使用异或运算
// 把 permission1 中的可删除权限删除
const res2 = permission1 ^ DELETE
/**
 * 1011
 * 1000
 * -------
 * 两个不同为1，否则为0
 * 0011
 */
console.log(res2.toString(2)) // 0011

// 这里有个问题，如果原来没有可删除权限，那么异或运算过后，就会有可删除权限了
/**
 * 0011 // 可读可写
 * 1000 // 可删除
 * -------
 * 两个不同为1，否则为0
 * 1011 // 这样异或过后就变成可读可写可删除了。
 */

// 等于说原来没有这个可删除权限，现在变成添加了，相等于就是添加的功能了，所以具体还需要到业务场景中判断，比如判断原来有，就是删除，原来没有的话，可以做添加等功能
```

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
export function createVNode(type, props?, children = null) {
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

### render 中的挂载，更新，卸载

之前将 vnode 渲染到 app 上，一直使用的 vue 官方的 render 函数，接下来实现自己的 render 函数。

- runtime-dom/src/index.ts

```ts{14}
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
import { createRenderer } from '@vue/runtime-core'

export * from '@vue/runtime-core'

const renderOptions = { patchProp, ...nodeOps }

// 创建渲染器，根据传入的 renderOptions参数，
const renderer = createRenderer(renderOptions)

export function render(vnode, container) {
  // 调用渲染器的 render 方法，将 vnode 渲染到 container 中
  renderer.render(vnode, container)
}

export { renderOptions }
```

`renderer` 中的 `render` 函数跟我们组件中的 `render` 不是同一个 `render`，它是用来渲染根组件的，`render` 函数的作用是将虚拟节点（`vnode`）渲染到指定的容器（`container`）中。具体来说，它分为三个步骤：**挂载、更新和卸载**。

- runtime-core/src/renderer.ts

```ts
import { ShapeFlags } from '@vue/shared'
import { isSameVNodeType } from './vnode'

export function createRenderer(options) {
  const render = (vnode, container) => {
    /**
     * 分三个步骤：
     * 1. 挂载：如果容器中没有之前的虚拟节点（container._vnode），则直接将新的虚拟节点挂载到容器中。
     * 2. 更新：如果容器中有之前的虚拟节点，则对比新旧虚拟节点，并进行更新操作。
     * 3. 卸载：如果传入的虚拟节点为 null，则卸载容器中现有的虚拟节点。
     */

    if (vnode == null) {
      // Todo: 卸载
    } else {
      // 挂载或者是更新流程
      patch(container._vnode || null, vnode, container)
    }

    // 把最新的 vnode 保存到 container 中，以便于下一次 diff 或者 卸载
    container._vnode = vnode
  }

  return {
    render,
  }
}
```

#### patch 函数

`patch` 函数的作用是用于更新和挂载虚拟节点（`vnode`）。具体来说，它会根据传入的老节点（`n1`）和新节点（`n2`）的情况，**决定是进行挂载操作还是更新操作**。函数的逻辑如下：

1. **相同节点检查**：如果传入的老节点和新节点是同一个节点，则不进行任何操作。
2. **类型检查**：如果老节点存在，且老节点和新节点的类型不同，则卸载老节点，并将老节点设为 null。
3. **挂载**：如果老节点为 null，则直接挂载新节点到容器中。
4. **更新**：如果老节点存在且类型相同，则进行更新操作。

```ts
/**
 * 更新和挂载，都用这个函数
 * @param n1 老节点，之前的，如果有，表示要跟 n2 做 diff，更新，如果没有，表示直接挂载 n2
 * @param n2 新节点
 * @param container 要挂载的容器
 */
const patch = (n1, n2, container) => {
  // 如果 n1 和 n2 一样，则不需要做任何操作
  if (n1 === n2) {
    return
  }

  // 如果两个节点类型不一样，则直接销毁老的，创建新的
  if (n1 && !isSameVNodeType(n1, n2)) {
    // 比如说 n1 是 div ，n2 是 span，这俩就不一样，或者 n1 的 key 是1，n2 的 key 是 2，也不一样，都要卸载掉 n1
    // 如果两个节点不是同一个类型，那就卸载 n1 直接挂载 n2
    unmount(n1)
    // 把 n1 设置为 null, 那么走到下面判断 就是走挂载新的逻辑
    n1 = null
  }

  if (n1 == null) {
    // 挂载新的
    mountElement(n2, container)
  } else {
    // 更新
    patchElement(n1, n2)
  }
}
```

`isSameVNodeType` 是一个辅助函数，用来判断节点是否可以复用。

```ts
// runtime-dom/src/vnode.ts

/**
 * 判断两个虚拟节点是否是同一个类型
 * @param n1 老节点
 * @param n2 新节点
 */
export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}
```

可以看到这个判断逻辑中，必须是相同的 `type`，并且 `key` 也相同，才可以复用，那就是说，`div` 和 `p` 这两个标签，是不能复用的，不同的 `key` 亦是如此，但是如果没有传递 `key`，那就表示 `key` 是 `undefined`，两个 `undefined` 是相同的，所以没传 `key`，就意味着 `key` 相等。

#### mountElement 挂载函数

`mountElement` 函数会将虚拟节点（`vnode`）挂载到指定的容器（`container`）中。具体来说，分为以下几个步骤：

1. **创建一个 DOM 节点**：根据虚拟节点的类型（`type`），创建一个对应的 `DOM` 元素，并将其赋值给虚拟节点的 `el` 属性(**这样后续可以通过 vnode.el 拿到对应dom，做卸载更新操作**)。
2. **设置节点的属性**：遍历虚拟节点的属性（`props`），并使用 `hostPatchProp` 函数将这些属性设置到刚创建的 `DOM` 元素上。
3. **挂载子节点**：根据虚拟节点的 `shapeFlag` 判断子节点的类型。如果子节点是文本，则使用 `hostSetElementText` 函数设置文本内容；如果子节点是数组，则递归调用 `mountChildren` 函数挂载每一个子节点。
4. **插入到容器中**：最后，将创建好的 `DOM` 元素插入到指定的容器中

```ts
// 挂载节点

export function createRenderer(options) {
  // 拿到 nodeOps 里面的操作 Dom 方法
  // 拿到 patchProp 方法，用来处理 props
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    createText: hostCreateText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = options

  const mountElement = (vnode, container) => {
    /**
     * 1. 创建一个 dom 节点
     * 2. 设置它的 props
     * 3. 挂载它的子节点
     */
    const { type, props, shapeFlag, children } = vnode

    // 1. 创建 Dom 元素 type --> div  p  span 等
    const el = hostCreateElement(type)

    // 给 vnode 上的 el 属性赋值，后续可以方便获取到 Dom 元素，做更新，卸载等操作
    vnode.el = el

    // 2. 设置它的 props
    for (const key in props) {
      // prevValue 为 null，因为是挂载操作，之前的没有值
      hostPatchProp(el, key, null, props[key])
    }

    // 3. 挂载它的子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 子节点是文本
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 子节点是数组
      mountChildren(children, el)
    }

    // 处理完后把 el 插入到 container 中
    hostInsert(el, container)
  }
}
```

这里还从 options 里面拿到了传入进来 patchProp，和 nodeOpts 里面的操作 dom 的方法

#### mountChildren 挂载子元素

```ts
// 挂载子元素
const mountChildren = (children, container) => {
  for (let i = 0; i < children.length; i++) {
    // 递归挂载子节点
    // n1 为 null，表示直接挂载
    patch(null, children[i], container)
  }
}
```

测试下挂载操作是否正常

```js
// import { render } from '../../../node_modules/vue/dist/vue.esm-browser.js'

import { h, render } from '../dist/vue.esm.js'

const vnode = h('div', { class: 'container', style: { color: 'red' } }, 'hello world')

render(vnode, app)
```

![20250709162227](https://tuchuang.coder-sunshine.top/images/20250709162227.png)

成功设置上去了，接下来处理卸载

#### unmount 函数

```ts{9-13}
const render = (vnode, container) => {
  /**
   * 分三个步骤：
   * 1. 挂载：如果容器中没有之前的虚拟节点（container._vnode），则直接将新的虚拟节点挂载到容器中。
   * 2. 更新：如果容器中有之前的虚拟节点，则对比新旧虚拟节点，并进行更新操作。
   * 3. 卸载：如果传入的虚拟节点为 null，则卸载容器中现有的虚拟节点。
   */

  if (vnode == null) {
    // 卸载
    if (container._vnode) {
      unmount(container._vnode)
    }
  } else {
    // 挂载或者是更新流程
    patch(container._vnode || null, vnode, container)
  }

  // 把最新的 vnode 保存到 container 中，以便于下一次 diff 或者 卸载
  container._vnode = vnode
}
```

`unmount` 函数会卸载虚拟节点（`vnode`）。具体来说，它会根据虚拟节点的类型和子节点的情况，递归地卸载所有子节点，并最终移除对应的 `DOM` 元素。

1. **检查子节点类型**：如果虚拟节点的子节点是数组类型，则递归卸载所有子节点。
2. **移除 `DOM` 元素**：调用 `hostRemove` 函数移除虚拟节点对应的 `DOM` 元素。

```ts
// 卸载
const unmount = vnode => {
  const { shapeFlag, children } = vnode
  // 如果子节点是数组，则递归卸载
  if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    unmountChildren(children)
  }

  // 移除dom元素
  hostRemove(vnode.el)
}
```

#### unmountChildren 卸载子元素

```ts
const unmountChildren = children => {
  for (let i = 0; i < children.length; i++) {
    unmount(children[i])
  }
}
```

测试卸载

```js
const vnode = h('div', { class: 'container', style: { color: 'red' } }, 'hello world')

render(vnode, app)

setTimeout(() => {
  // 5秒后卸载 vnode
  render(null, app)
}, 5000)
```

![20250709164240](https://tuchuang.coder-sunshine.top/images/20250709164240.png)

![20250709164247](https://tuchuang.coder-sunshine.top/images/20250709164247.png)

可以看到 div 已经被成功卸载了。

#### patchElement

`patchElement` 函数的作用是更新已经存在的 DOM 元素，以便复用现有的 `DOM` 结构并应用新的属性和子节点。具体来说，它分为以下几个步骤：

1. **复用 `DOM` 元素**：将旧虚拟节点（`n1`）的 `DOM` 元素（`el`）赋值给新虚拟节点（`n2`），以便复用现有的 `DOM` 元素。
2. **更新属性（`props`）**：调用 `patchProps` 函数，对比旧属性（`oldProps`）和新属性（`newProps`），并应用属性的变化。
3. **更新子节点（`children`）**：调用 `patchChildren` 函数，对比旧子节点和新子节点，并应用子节点的变化。

```ts
const patchElement = (n1, n2) => {
  /**
   * 1. 复用 dom 元素
   * 2. 更新 props
   * 3. 更新 children
   */
  // 复用 dom 元素 每次进来，都拿上一次的 el，保存到最新的虚拟节点上 n2.el  const el = (n2.el = n1.el)
  n2.el = n1.el
  const el = n2.el

  // 更新 el 的 props
  const oldProps = n1.props
  const newProps = n2.props
  patchProps(el, oldProps, newProps)

  // 更新 children
  patchChildren(n1, n2)
}
```

#### patchProps

`patchProps` 函数的作用是**更新DOM元素的属性（`props`）**。具体来说，它执行以下操作：

1. **清除旧属性**：如果存在旧属性（`oldProps`），它会遍历所有旧属性，并调用`hostPatchProp`函数将每个属性从`DOM`元素上移除。**这是通过将新值设为`null`来实现的**。
2. **设置新属性**：如果存在新属性（`newProps`），它会遍历所有新属性，并调用`hostPatchProp`函数将每个属性设置到`DOM`元素上。这里会传入旧的属性值（`null`）和新的属性值，以便`hostPatchProp`函数能够进行更智能的更新。

```ts
const patchProps = (el, oldProps, newProps) => {
  // 清楚旧属性
  if (oldProps) {
    for (const key in oldProps) {
      hostPatchProp(el, key, oldProps[key], null)
    }
  }

  // 设置新属性
  for (const key in newProps) {
    hostPatchProp(el, key, null, newProps[key])
  }
}
```

先测试下

```js
const vnode1 = h('div', { class: 'container', style: { color: 'red' } }, 'hello world')
const vnode2 = h('div', { class: 'container', style: { color: 'blue' } }, 'vnode2')

render(vnode1, app)

setTimeout(() => {
  // render(null, app)
  console.log('定时器执行了')
  render(vnode2, app)
}, 2000)
```

![20250709171939](https://tuchuang.coder-sunshine.top/images/20250709171939.png)

![20250709172019](https://tuchuang.coder-sunshine.top/images/20250709172019.png)

报错了，这个错误的意思是 **无法在空值中使用`in`运算符查找`color`**

因为这里在清除就属性的时候 `hostPatchProp`,最后一个参数 `nextValue` 传了 `null`

![20250709172804](https://tuchuang.coder-sunshine.top/images/20250709172804.png)

修改之前的 patchStyle 函数

```ts
export function patchStyle(el, prevValue, nextValue) {
  const style = el.style
  console.log('prevValue==>', prevValue)
  console.log('nextValue==>', nextValue)

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
      if (!(key in nextValue)) { // [!code --]
      if (nextValue?.[key] == null) { // [!code ++]
        style[key] = null
      }
    }
  }
}
```

![20250709173118](https://tuchuang.coder-sunshine.top/images/20250709173118.png)

这样字体就正常变成蓝色了

#### patchChildren

`patchChildren` 函数负责更新子元素，由于子元素的情况比较多，大概总结为以下情况

- **新的子元素是文本**
  - 老节点是数组，卸载老的 `children`，将新的文本设置成 `children`
  - 老的是文本，直接替换
  - 老的是 `null`，不用关心老的，将新的设置成 `children`
- **新的子元素是数组**
  - 老的是数组，那就和新的做全量 `diff`
  - 老的是文本，把老的清空，挂载新的 `children`
  - 老的是 `null`，不用关心老的，直接挂载新的 `children`
- **新的子元素是 null**
  - 老的是文本，把 `children` 设置成空
  - 老的是数组，卸载老的
  - 老的是 `null`，俩个哥们都是 `null`，不用干活

```ts
const patchChildren = (n1, n2) => {
  const el = n2.el
  const prevShapeFlag = n1.shapeFlag
  const shapeFlag = n2.shapeFlag

  //  新的是文本
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    // 老的是数组
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 卸载老的
      unmountChildren(n1.children)
    }

    // 老的和新的不一样
    if (n1.children !== n2.children) {
      // 将新文本设置成 children
      hostSetElementText(el, n2.children)
    }
  } else {
    /**
     * 新的是有可能 数组 或者是 null
     * 老的有可能 数组 或者是 文本 或者是 null
     */

    // 老的是文本
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 把老的文本清空
      hostSetElementText(el, '')

      // 新的是数组
      if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 挂载新的
        mountChildren(n2.children, el)
      }

      // 是 null 就不管，
    } else {
      /**
       * 老的是数组 或者 null
       * 新的还是 数组 或者 null
       */

      // 老的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新的也是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // Todo 全量 diff
        } else {
          // 老的是数组，新的为 null
          unmountChildren(n1.children)
        }
      } else {
        // 老的是 null
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新的是数组,挂载新的
          mountChildren(n2.children, el)
        }
      }
    }
  }
}
```

测试

```js
const vnode1 = h('div', { class: 'container', style: { color: 'red' } }, [h('p', '123'), h('p', '456')])
const vnode2 = h('div', { class: 'container', style: { backgroundColor: 'blue', height: '100px' } })

render(vnode1, app)

setTimeout(() => {
  // render(null, app)
  console.log('定时器执行了')
  render(vnode2, app)
}, 2000)
```

![20250710134557](https://tuchuang.coder-sunshine.top/images/20250710134557.png)

![20250710134603](https://tuchuang.coder-sunshine.top/images/20250710134603.png)

### diff 算法

**全量 diff 主要是针对两个子节点都是数组的情况，我们需要对它所有的子元素进行全量更新，那么这种更新非常消耗性能，在 vue 中会尝试着尽可能的服用 dom，来进行更新。**

#### 双端 diff

##### 头部对比

```js
import { h, render } from '../dist/vue.esm.js'

const vnode1 = h('div', { style: { color: 'red' } }, [h('p', { key: 'a' }, 'a'), h('p', { key: 'b' }, 'b')])
const vnode2 = h('div', { style: { color: 'blue' } }, [
  h('p', { key: 'a' }, 'a'),
  h('p', { key: 'b' }, 'b'),
  h('p', { key: 'c' }, 'c'),
  h('p', { key: 'd' }, 'd'),
])

render(vnode1, app)

setTimeout(() => {
  console.log('定时器执行了')
  render(vnode2, app)
}, 2000)
```

假设子节点是通过 `v-for` 遍历渲染出来的，最开始数组为 `c1 = [a,b]`，更新后为 `c2 = [a,b,c,d]`，此时需要**从头开始依次进行对比**，`c1` 的第一个为 `a`，`c2` 的第一个也是 `a`，他们的 `key` 都是可以对应的上的，所以依次对比 `a` 和 `b`，到 `c` 之后，发现 `c1` 里面没有 `c`，那就直接挂载新的子节点就可以了

```ts
const patchKeyedChildren = (c1, c2, container) => {
  /**
   * 双端对比
   * 1. 头部对比
   * 2. 尾部对比
   * old: [a,b]
   * new: [a,b,c,d]
   */

  let i = 0
  // 老的子节点最后一个元素的下标
  let e1 = c1.length - 1 // 1
  // 新的子节点最后一个元素的下标
  let e2 = c2.length - 1 // 3

  // 1. 头部对比
  while (i <= e1 && i <= e2) {
    const n1 = c1[i]
    const n2 = c2[i]

    // 如果是相同类型，则直接 patch 对比
    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2, container)
    } else {
      break
    }

    i++
  }

  console.log('i==>', i)
  console.log('e1==>', e1)
  console.log('e2==>', e2)
}
```

![20250714095438](https://tuchuang.coder-sunshine.top/images/20250714095438.png)

![20250714095527](https://tuchuang.coder-sunshine.top/images/20250714095527.png)

可以看到 `i` 此时为 `2`，`2` 大于 `e1` 所以就跳出 `while` 循环了

##### 尾部对比

```js
const vnode1 = h('div', [h('p', { key: 'a', style: { color: 'red' } }, 'a'), h('p', { key: 'b', style: { color: 'red' } }, 'b')])
const vnode2 = h('div', [
  h('p', { key: 'c', style: { color: 'blue' } }, 'c'),
  h('p', { key: 'd', style: { color: 'blue' } }, 'd'),
  h('p', { key: 'a', style: { color: 'blue' } }, 'a'),
  h('p', { key: 'b', style: { color: 'blue' } }, 'b'),
])

render(vnode1, app)

setTimeout(() => {
  console.log('定时器执行了')
  render(vnode2, app)
}, 2000)
```

有的时候并不是在尾巴插入新的元素，也可能是从头部插入新的元素，例如 `c1 = [a,b]`，更新后为 `c2 = [c,d,a,b]`，第一次 `a` 和 `c` 就对比不上了，就跳出循环了，**此时需要看下尾部能不能对比上，从尾部就行对比**

```ts
const patchKeyedChildren = (c1, c2, container) => {
  /**
   * 双端对比
   * 1. 头部对比
   * old: [a,b]
   * new: [a,b,c,d]
   */

  let i = 0
  // 老的子节点最后一个元素的下标
  let e1 = c1.length - 1 // 1
  // 新的子节点最后一个元素的下标
  let e2 = c2.length - 1 // 3

  // 1. 头部对比
  // ... 头部对比代码

  /**
   * 双端对比
   * 2. 尾部对比
   * old: [a,b]
   * new: [c,d,a,b]
   */

  //  尾部对比
  while (i <= e1 && i <= e2) {
    const n1 = c1[e1]
    const n2 = c2[e2]

    // 如果是相同类型，则直接 patch 对比
    if (isSameVNodeType(n1, n2)) {
      patch(n1, n2, container)
    } else {
      break
    }

    e1--
    e2--
  }

  console.log('i==>', i)
  console.log('e1==>', e1)
  console.log('e2==>', e2)
}
```

![20250714104534](https://tuchuang.coder-sunshine.top/images/20250714104534.png)

![20250714104541](https://tuchuang.coder-sunshine.top/images/20250714104541.png)

还有 c1 比 c2 长的情况。

头部对比

```js
const vnode1 = h('div', [
  h('p', { key: 'a', style: { color: 'red' } }, 'a'),
  h('p', { key: 'b', style: { color: 'red' } }, 'b'),
  h('p', { key: 'c', style: { color: 'red' } }, 'c'),
  h('p', { key: 'd', style: { color: 'red' } }, 'd'),
])
const vnode2 = h('div', [
  h('p', { key: 'a', style: { color: 'blue' } }, 'a'),
  h('p', { key: 'b', style: { color: 'blue' } }, 'b'),
])
```

![20250714105134](https://tuchuang.coder-sunshine.top/images/20250714105134.png)

![20250714105148](https://tuchuang.coder-sunshine.top/images/20250714105148.png)

尾部对比

```js
const vnode1 = h('div', [
  h('p', { key: 'c', style: { color: 'red' } }, 'c'),
  h('p', { key: 'd', style: { color: 'red' } }, 'd'),
  h('p', { key: 'a', style: { color: 'red' } }, 'a'),
  h('p', { key: 'b', style: { color: 'red' } }, 'b'),
])
const vnode2 = h('div', [
  h('p', { key: 'a', style: { color: 'blue' } }, 'a'),
  h('p', { key: 'b', style: { color: 'blue' } }, 'b'),
])
```

![20250714105230](https://tuchuang.coder-sunshine.top/images/20250714105230.png)

![20250714105243](https://tuchuang.coder-sunshine.top/images/20250714105243.png)

##### 结论

第一种情况对比后 (头部对比，新的长)

old: [a,b]
new: [a,b,c,d]

- i ==> 2
- e1 ==> 1
- e2 ==> 3

第二种情况对比后 (尾部对比，新的长)

old: [a,b]
new: [c,d,a,b]

- i ==> 0
- e1 ==> -1
- e2 ==> 1

第三种情况对比后 (头部对比，新的短)
old: [a,b,c,d]
new: [a,b]

- i ==> 2
- e1 ==> 3
- e2 ==> 1

第四种情况对比后 (尾部对比，新的短)
old: [c,d,a,b]
new: [a,b]

- i ==> 2
- e1 ==> 3
- e2 ==> 1

当双端 `diff` 完成后，我们可以得出以下结论，当 `i > e1` 的时候，表示新的子节点多，老的子节点少，所以我们需要插入新的子节点，插入的范围为 `i -> e2`，反之当 `i > e2` 的时候，表示老的多，新的少，需要将老的子节点中多余的卸载掉，代码实现如下：

```ts
if (i > e1) {
  /**
   * 根据双端对比，得出结论：
   * i > e1 表示老的少，新的多，要挂载新的，挂载的范围是 i -> e2
   */

  while (i <= e2) {
    patch(null, c2[i], container)
    i++
  }
} else if (i > e2) {
  /**
   * 根据双端对比，得出结果：
   * i > e2 的情况下，表示老的多，新的少，要把老的里面多余的卸载掉，卸载的范围是 i - e1
   */
  while (i <= e1) {
    unmount(c1[i])
    i++
  }
}
```

![20250714133544](https://tuchuang.coder-sunshine.top/images/20250714133544.png)

![20250714133552](https://tuchuang.coder-sunshine.top/images/20250714133552.png)

这样就成功把 `c,d` 添加到 `vnode2` 上了，但是这样在 `patch` 的时候可能会有点问题，有的时候不是直接添加到后面的，可能会从前面添加

```js
const vnode1 = h('div', [h('p', { key: 'a', style: { color: 'red' } }, 'a'), h('p', { key: 'b', style: { color: 'red' } }, 'b')])

const vnode2 = h('div', [
  h('p', { key: 'c', style: { color: 'red' } }, 'c'),
  h('p', { key: 'd', style: { color: 'red' } }, 'd'),
  h('p', { key: 'a', style: { color: 'blue' } }, 'a'),
  h('p', { key: 'b', style: { color: 'blue' } }, 'b'),
])
```

![20250714133957](https://tuchuang.coder-sunshine.top/images/20250714133957.png)

这样的话结果还是这样，很明显不对，在插入的时候，比如c应该是插在 `a` 的前面，然后 `d` 也是插在 `a` 的前面，也就是这里锚点元素是 `a`，这里需要改掉之前的**挂载元素**的方法,也就是 `mountElement` 最后在**插入节点**的时候需要把 **锚点** 传过去

```ts

// 修改 mountElement 函数，添加 anchor 锚点参数

// 挂载节点
const mountElement = (vnode, container) => { // [!code --]
const mountElement = (vnode, container, anchor) => { // [!code ++]
  // ...

  // 处理完后把 el 插入到 container 中
  hostInsert(el, container) // [!code --]
  hostInsert(el, container, anchor) // [!code ++]
}
```

那么 patch 函数也需要接受 锚点参数

```ts
/**
 * 更新和挂载，都用这个函数
 * @param n1 老节点，之前的，如果有，表示要跟 n2 做 diff，更新，如果没有，表示直接挂载 n2
 * @param n2 新节点
 * @param container 要挂载的容器
 * @param anchor 锚点
 */
const patch = (n1, n2, container, anchor = null) => {
  // ...

  if (n1 == null) {
    // 挂载新的
    mountElement(n2, container, anchor)
  } else {
    // 更新
    patchElement(n1, n2)
  }
}
```

这样在对比的时候，插入元素的时候就可以先拿到 **锚点**，然后把需要插入的**元素都插到锚点之前**就行了。

```ts
// ... 省略 双端 diff

if (i > e1) {
  /**
   * 根据双端对比，得出结论：
   * i > e1 表示老的少，新的多，要挂载新的，挂载的范围是 i -> e2
   */

  // 锚点元素就是下一个元素
  const nextPos = e2 + 1

  const anchor = nextPos < c2.length ? c2[nextPos].el : null
  console.log(anchor)

  while (i <= e2) {
    patch(null, c2[i], container)
    i++
  }
} else if (i > e2) {
  /**
   * 根据双端对比，得出结果：
   * i > e2 的情况下，表示老的多，新的少，要把老的里面多余的卸载掉，卸载的范围是 i - e1
   */
  while (i <= e1) {
    unmount(c1[i])
    i++
  }
}
```

![20250714142357](https://tuchuang.coder-sunshine.top/images/20250714142357.png)

可以看到 锚点元素 就是 `a`，然后把 `c,d` 全部插入到 `a` 前面就行了。

#### 乱序 diff

双端 diff 只是建立在数据比较理想的情况下，顺序也没有变，这种情况下是比较容易对比的，如果数据乱序了呢？

```js
// c1 => [a, b, c, d, e]
const vnode1 = h('div', [
  h('p', { key: 'a', style: { color: 'blue' } }, 'a'),
  h('p', { key: 'b', style: { color: 'blue' } }, 'b'),
  h('p', { key: 'c', style: { color: 'blue' } }, 'c'),
  h('p', { key: 'd', style: { color: 'blue' } }, 'd'),
  h('p', { key: 'e', style: { color: 'blue' } }, 'e'),
])

// c2 => [a, c, d, b, e]
const vnode2 = h('div', [
  h('p', { key: 'a', style: { color: 'red' } }, 'a'),
  h('p', { key: 'c', style: { color: 'red' } }, 'c'),
  h('p', { key: 'd', style: { color: 'red' } }, 'd'),
  h('p', { key: 'b', style: { color: 'red' } }, 'b'),
  h('p', { key: 'e', style: { color: 'red' } }, 'e'),
])
```

在这组数据中，我们可以看到，数据从 `[a, b, c, d, e]` 变为 `[a, c, d, b, e]`，这样的话顺序就发生了变化，但是这些 `key` 还是在的，所以我们就需要去找到对应的 `key`，进行 `patch`，此处我们先不考虑顺序的问题，看图

![20250714160725](https://tuchuang.coder-sunshine.top/images/20250714160725.png)

当双端 `diff` 结束后，此时 `i = 1,e1 = 3,e2 = 3`，此时 `i` 既不大于 `e1` 也不小于 `e2`，中间还有三个没有对比完，但是这些 `key` 还是在的，所以我们需要到 `c1` 中找到对应 `key` 的虚拟节点，进行 `patch`：

```ts
const patchKeyedChildren = (c1, c2, container) => {
  // ...
  if (i > e1) {
    // ...
  } else if (i > e2) {
    // ...
  } else {
    /**
     * 乱序对比
     */

    // 老的子节点开始查找的位置
    let s1 = i
    // 新的子节点开始查找的位置
    let s2 = i

    // 需要一个映射表，遍历新的还没有更新的 也就是 s2 -> e2 的节点，建立一个映射表
    // 然后遍历老的，看看老的节点是否在新的映射表中，如果在，则进行 patch，如果不在，则卸载
    const keyToNewIndexMap = new Map()

    for (let j = s2; j <= e2; j++) {
      const n2 = c2[j]
      keyToNewIndexMap.set(n2.key, j)
    }
    console.log(keyToNewIndexMap)

    // 遍历老的，看看老的节点是否在新的映射表中，如果在，则进行 patch，如果不在，则卸载
    for (let j = s1; j <= e1; j++) {
      const n1 = c1[j]
      const newIndex = keyToNewIndexMap.get(n1.key)
      // 如果有，则进行 patch
      if (newIndex != null) {
        patch(n1, c2[newIndex], container)
      } else {
        // 如果没有，则卸载
        unmount(n1)
      }
    }
  }
}
```

![20250714162109](https://tuchuang.coder-sunshine.top/images/20250714162109.png)

在这段代码中，声明了一个 `keyToNewIndexMap` 用来保存 `c2` 中 `key` 对应的 `index`，这样我们后续就可以快速的通过这个 `key` 找到对应的虚拟节点进行 `patch`，至此，该更新的就更新完了，但是目前顺序还是不对，我们需要遍历新的子节点，将每个子节点插入到正确的位置：

```ts
// 遍历新的，将每个子节点插入到正确的位置
for (let j = e2; j >= s2; j--) {
  /**
   * 倒序插入
   */
  const n2 = c2[j]
  const anchor = c2[j + 1]?.el || null
  console.log(anchor)

  // 依次进行倒序插入，保证顺序的一致性
  hostInsert(n2.el, container, anchor)
}
```

> [!WARNING] 注意
> 这里需要注意的是需要倒序插入，因为只有 `insertBefore` 方法，也就是在指定节点之前插入，没有 `insertAfter` 方法

![20250714165544](https://tuchuang.coder-sunshine.top/images/20250714165544.png)

可以看到 锚点节点 分别为 `e b d`，是正确的。

之前 `在遍历老的，看看老的节点是否在新的映射表中，如果在，则进行 patch，如果不在，则卸载`

但是 如果老的没有，新的有，这种情况还没有处理

给vnode2 添加一个 `h('p', { key: 'f', style: { color: 'red' } }, 'f'),`

![20250714165909](https://tuchuang.coder-sunshine.top/images/20250714165909.png)

报错了，说 insertBefore 第一个参数不是一个节点类型，打印一下看看

![20250714170531](https://tuchuang.coder-sunshine.top/images/20250714170531.png)

可以看到 f 节点的 el 为 null，因为这里 n1 n2 都是数组，就走到了 全量 diff 里面，然后 f 节点 尾部对比 也没有对比上，就走了乱序 diff，乱序 diff 中可以发现 从始至终 f 节点都没有被 patch 过，所以这里 老的没有，新的有的，应该重新挂载一遍 才对。

```ts
// 遍历新的，将每个子节点插入到正确的位置
for (let j = e2; j >= s2; j--) {
  /**
   * 倒序插入
   */
  const n2 = c2[j]
  const anchor = c2[j + 1]?.el || null
  console.log('anchor===>', anchor)
  console.log('n2===>', n2)

  if (n2.el) {
    // 依次进行倒序插入，保证顺序的一致性
    hostInsert(n2.el, container, anchor)
  } else {
    // 没有 el，说明是新节点，重新挂载就行了
    patch(null, n2, container, anchor)
  }
}
```

![20250714171119](https://tuchuang.coder-sunshine.top/images/20250714171119.png)

#### 最长递增子序列

按照上面的例子，目前已经顺利的把 `[a,b,c,d,e]` 改成 `[a,c,d,b,e,f]` 了，但是这里在遍历的过程中，其实是有性能问题的。

**分析：在插入之前 debugger**

```ts
for (let j = e2; j >= s2; j--) {
  const n2 = c2[j]
  const anchor = c2[j + 1]?.el || null

  if (n2.el) {
    debugger // 在插入之前 debugger
    // 依次进行倒序插入，保证顺序的一致性
    hostInsert(n2.el, container, anchor)
  } else {
    // 没有 el，说明是新节点，重新挂载就行了
    patch(null, n2, container, anchor)
  }
}
```

![20250719224526](https://tuchuang.coder-sunshine.top/images/20250719224526.png)

最开始 `f` 因为是新节点，所以直接挂载，第二次循环的时候，`n2` 就是 `e`，锚点是 `f`，那么就把 `e` 插入到 `f` 前面

![20250719224743](https://tuchuang.coder-sunshine.top/images/20250719224743.png)

第三次循环的时候，`n2`就是 `b`，锚点是`e`，那么把 `b` 插到 `e` 前面就行了，

![20250719224950](https://tuchuang.coder-sunshine.top/images/20250719224950.png)

当把 `b` 插入到 `e` 前面的时候，可以发现此时顺序已经是对的了，但是由于目前还没有做任何处理，所以循环还是得继续下去，会把 `d` 插到 `b` 前面，然后把 `c` 插到 `d` 前面，

> [!IMPORTANT] 最长递增子序列
> 经过上面的分析，可以发现，当我们想把 `[a,b,c,d,e]`改成 `[a,c,d,b,e,f]`，在最开始进行双端 `diff` 和乱序 `diff` 后，真实 `dom` 已经更新好了，后面纠正位置的时候，先进行 `f` 挂载后，等价于把 `[a,b,c,d,e]`改成 `[a,c,d,b,e]`，其实只需要把 `b` 移动到 `c` 前面，就变成了 `[a,b,c,d,e]`，其他位置都不需要动，不需要额外的移动 `dom` 了。**我们需要找到一个方法（vue中用的是 贪心算法 加 二分查找）把 `b` 直接移动 到 `c` 前面就行了**，这就是**最长递增子序列**

再来分析下我们之前的数据，先不用管 `f`，就把 `[a,b,c,d,e]`改成 `[a,c,d,b,e]`

![20250719231819](https://tuchuang.coder-sunshine.top/images/20250719231819.png)

只需要把 `b` 移动 `e` 的前面就行了，这样就可以不动其他的了

![20250719232126](https://tuchuang.coder-sunshine.top/images/20250719232126.png)

这样就可以发现**最长递增子序列**就是 `[2,3]`，也就是只需要动下标为`1`的就行了，也就是动`b`就行了，

顾名思义最长递增子序列，就是在一个**序列中**找到**最长的连续递增子序列**，我们来列几组数据：

- [1, 5, 3, 4, 7, 8]
- [10, 3, 5, 9, 12, 8, 15, 18]

我们一眼就可以看出第一组序列中最长的递增子序列是 [1, 3, 4, 7, 8]
先看 [1, 5, 3, 4, 7, 8] 怎么算，掌握一下概念

- 1：LIS = [1]（空列表直接加入 1）
- 5：LIS = [1, 5]（5 大于 1，直接追加）
- 3：LIS = [1, 3]（3 小于 5，用 3 替换 5）
- 4：LIS = [1, 3, 4]（4 大于 3，追加）
- 7：LIS = [1, 3, 4, 7]（7 大于 4，追加）
- 8：LIS = [1, 3, 4, 7, 8]（8 大于 7，追加）

由此算出最长递增子序列为 [1, 3, 4, 7, 8]

第二组 [10, 3, 5, 9, 12, 8, 15, 18]

- 10：LIS = [10]（空列表直接加入 10）
- 3：LIS = [3]（3 小于 10，用 3 替换 10）
- 5：LIS = [3, 5]（5 大于 3，追加）
- 9：LIS = [3, 5, 9]（9 大于 5，追加）
- 12：LIS = [3, 5, 9, 12]（12 大于 9，追加）
- 8：LIS = [3, 5, 8, 12]（8 小于 9，用 8 替换 9）-- **也就是找到第一个比自己大的数替换**
- 15：LIS = [3, 5, 8, 12, 15]（15 大于 12，追加）
- 18：LIS = [3, 5, 8, 12, 15, 18]（18 大于 15，追加）

由此算出最长递增子序列为 [3, 5, 8, 12, 15, 18]，但是很遗憾，8 和 12 的顺序似乎出现了错误，没关系，vue3 里面使用了**反向追溯**的方式，来修正这个最长递增子序列，来看一下

- 10：LIS = [10]（空列表直接加入 10，记录 10 的前一个为 null）
- 3：LIS = [3]（3 小于 10，用 3 替换 10，记录 3 的前一个为 null）
- 5：LIS = [3, 5]（5 大于 3，追加，记录 5 的前一个为 3）
- 9：LIS = [3, 5, 9]（9 大于 5，追加，记录 9 的前一个为 5）
- 12：LIS = [3, 5, 9, 12]（12 大于 9，追加，记录 12 的前一个为 9）
- 8：LIS = [3, 5, 8, 12]（8 小于 9，用 8 替换 9，记录 8 的前一个为 5）
- 15：LIS = [3, 5, 8, 12, 15]（15 大于 12，追加，记录 15 的前一个为 12）
- 18：LIS = [3, 5, 8, 12, 15, 18]（18 大于 15，追加，记录 18 的前一个为 15）

结束以后我们通过最后一个倒序追溯

- 起点：18（最后一个元素）
- 18 的前驱是 → 15
- 15 的前驱是 → 12
- 12 的前驱是 → 9
- 9 的前驱是 → 5
- 5 的前驱是 → 3
  所以 最终正确的 LIS = [3, 5, 9, 12, 15, 18]

接下来实现求最长递增子序列的函数

```ts
function getSequence(arr) {
  // 记录结果数组，存的是索引
  const result = []

  // 记录前驱节点
  const map = new Map()

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]

    if (result.length === 0) {
      // 如果 result 一个都没有，就把当前的索引放进去，第一个也不用记录前驱节点
      result.push(i)
      continue
    }

    // 拿到最后一个索引
    const lastIndex = result[result.length - 1]
    // 拿到最后一个元素
    const lastItem = arr[lastIndex]

    // 当前元素大于最后一个元素
    if (item > lastItem) {
      // 直接 push ，并且记录 当前 i 的前驱节点
      result.push(i)
      map.set(i, lastIndex)
      continue
    }

    // 此时需要找到第一个比自己大的数，并且替换 --> 二分查找
    console.log('result', result)

    let left = 0
    let right = result.length - 1

    /**
     * 需要找到第一个比当前值大的值
     * 如果中间值小于当前值，那么第一个比当前值大的肯定在右边
     * 如果中间值大于当前值，那么第一个比当前值大的肯定在左边
     */
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const midItem = arr[result[mid]]

      if (midItem < item) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    if (arr[result[left]] > item) {
      // 第一个不用记录前驱节点
      if (left > 0) {
        // 记录前驱节点
        map.set(i, result[left - 1])
      }
      // 找到最合适的，把索引替换进去
      result[left] = i
    }
  }

  // 反向追溯
  let l = result.length

  let last = result[l - 1]

  while (l > 0) {
    l--
    // 纠正顺序
    result[l] = last
    // 下一次的last等于当前last记录的前驱节点
    last = map.get(last)
  }

  return result
}

console.log(getSequence([10, 3, 5, 9, 12, 8, 15, 18]))
```

![20250720100722](https://tuchuang.coder-sunshine.top/images/20250720100722.png)

这里打印的是 `[ 1, 2, 3, 4, 6, 7 ]`，因为我们需要的就是索引,`[3, 5, 9, 12, 15, 18]` 对应索引就是`[ 1, 2, 3, 4, 6, 7 ]`，也就是最长递增子序列。
