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
