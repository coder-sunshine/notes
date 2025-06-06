# 响应式系统

## 响应式最基础的实现

### 响应式数据 ref

响应式数据ref是一个包装器对象，他可以让我们追踪简单值的变化

- `get`: 当我们读取 .value 的时候，触发 get 此时在 get 中会收集依赖，也就是建立响应式数据和 effect 之间的关联关系
- `set`：当我们重新给 .value 赋值的时候，触发 set，此时在 set 中会找到之前 get 的时候收集的依赖，触发更新

- constants.ts

```ts
export enum ReactiveFlags {
  IS_REF = '__v_isRef',
}
```

- ref.ts

```ts
import { ReactiveFlags } from './constants'
import { activeSub } from './effect'

export class RefImpl<T = any> {
  _value: T

  // ref标记
  public readonly [ReactiveFlags.IS_REF] = true

  // 保存和 effect 之间的关联关系
  subs

  constructor(value: T) {
    this._value = value
  }

  get value() {
    // 在读取的时候，把当前的 activeSub 保存到 subs 里面
    if (activeSub) {
      console.log('读取了value', this._value)
      this.subs = activeSub
    }
    return this._value
  }

  set value(newVal) {
    console.log('设置了value', newVal)
    this._value = newVal

    // 通知 effect 重新执行，获取到最新的值
    this.subs?.()
  }
}

function createRef(rawValue: unknown) {
  // 如果是ref，则直接返回
  if (isRef(rawValue)) {
    return rawValue
  } else {
    // 如果不是ref，则创建一个ref
    return new RefImpl(rawValue)
  }
}

export function ref(value?: unknown) {
  return createRef(value)
}

/**
 * @description 判断是不是一个 ref
 * @param value
 */
export function isRef(value: any) {
  return value ? value[ReactiveFlags.IS_REF] === true : false
}
```

- effect.ts

```ts
// 用来保存当前正在执行的 effect
// fn 调用，那么 fn 里面的依赖就会触发相应的 get set 操作等。就可以初步建立关联关系
export let activeSub

export function effect(fn) {
  // 将 fn 保存在全局 activeSub 上，这样在触发更新的时候就可以通知当前的fn 再次执行
  activeSub = fn
  activeSub()
  // 执行完之后，将 activeSub 设置为 undefined，不然会一直 重复做 this.subs = activeSub 的操作
  activeSub = undefined
}
```

![20250604173144](https://tuchuang.coder-sunshine.top/images/20250604173144.png)

### 链表链接dep和sub

使用链表节点将dep和sub串起来，当dep发生变化时，通过dep关联的链表节点link找到对应的sub,通知sub重新执行。

- 01-demo.html

```js
import { ref, effect } from '../dist/reactivity.esm.js'

const count = ref(0)

effect(() => {
  console.dir(count)
  console.log('effect执行了', count.value)
})

effect(() => {
  console.dir(count)
  console.log('effect执行了2', count.value)
})

setTimeout(() => {
  count.value++
}, 1000)
```

- system.ts

```ts
/**
 * 依赖项
 */
export interface Dependency {
  // 订阅者链表的头节点
  subs?: Link
  // 订阅者链表的尾节点
  subsTail?: Link
}

/**
 * 订阅者
 */
export interface Subscriber {
  // 依赖项链表的头节点
  deps?: Link
  // 依赖项链表的尾节点
  depsTail?: Link
}

/**
 * 链表节点
 */
export interface Link {
  // 订阅者
  sub: Subscriber
  // 下一个订阅者节点
  nextSub?: Link
  // 上一个订阅者节点
  prevSub?: Link
  // 依赖项
  dep?: Dependency
  // 下一个依赖项节点
  nextDep?: Link
}

/**
 * 建立dep和sub的关联
 * @param dep
 * @param sub
 */
export function link(dep: Dependency, sub: Subscriber) {
  // 创建一个节点
  const newLink: Link = {
    sub,
    nextSub: undefined,
    prevSub: undefined,
    nextDep: undefined,
  }

  // 如果尾结点有，说明头结点肯定有
  if (dep.subsTail) {
    // 把新节点加到尾结点
    dep.subsTail.nextSub = newLink
    // 把新节点 prevSub 指向原来的尾巴
    newLink.prevSub = dep.subsTail
    // 更新尾结点
    dep.subsTail = newLink
  } else {
    dep.subs = dep.subsTail = newLink
  }
}

/**
 * 传播更新
 * @param subs
 */
export function propagate(subs: Link) {
  let link = subs

  // 创建一个 sub 的 队列，处理完后依次执行
  let queuedEffect = []

  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }

  // 拿到所有的sub执行
  queuedEffect.forEach(effect => effect.run())
}
```

- ref.ts

```ts
import { ReactiveFlags } from './constants'
import { activeSub } from './effect'
import { Dependency, link, Link, propagate, Subscriber } from './system'

export class RefImpl<T = any> {
  _value: T

  // ref标记
  public readonly [ReactiveFlags.IS_REF] = true

  /**
   * 订阅者链表的头节点
   */
  subs: Link

  /**
   * 订阅者链表的尾节点
   */
  subsTail: Link

  constructor(value: T) {
    this._value = value
  }

  get value() {
    trackRef(this)
    return this._value
  }

  set value(newVal) {
    this._value = newVal
    triggerRef(this)
  }
}

function createRef(rawValue: unknown) {
  // 如果是ref，则直接返回
  if (isRef(rawValue)) {
    return rawValue
  } else {
    // 如果不是ref，则创建一个ref
    return new RefImpl(rawValue)
  }
}

export function ref(value?: unknown) {
  return createRef(value)
}

/**
 * @description 判断是不是一个 ref
 * @param value
 */
export function isRef(value: any) {
  return value ? value[ReactiveFlags.IS_REF] === true : false
}

/**
 * 收集依赖，建立 ref 和 effect 之间的链表关系
 * @param dep
 */
export function trackRef(dep: Dependency) {
  activeSub && link(dep, activeSub)
}

/**
 * 通知dep关联的sub重新执行
 * @param dep
 */
export function triggerRef(dep: Dependency) {
  dep.subs && propagate(dep.subs)
}
```

![20250606093551](https://tuchuang.coder-sunshine.top/images/20250606093551.png)

这样就把关联关系的数据结构，做成了**双向链表**，这样修改后，依赖收集就如图所示

![响应式系统链表关联示意图](https://tuchuang.coder-sunshine.top/images/20250606091657.png)

- `count` 是一个响应式数据源（ref），包含 `subs` 属性
- `effect1` 和 `effect2` 是两个副作用函数
- `count` 通过 `subs` 指向了一个 `link1` 节点（头节点）
- 这个头节点的 `sub` 指向了 `effect1`
- 节点有一个 `nextSub` 属性，指向链表的下一个节点 `link2`
- `link2` 的 `sub` 指向 `effect2`
- 当执行 `count.value = 1` 时，会触发 `ref` 的 `set` 方法
- 在 `set` 中会通过 `subs` 遍历整个链表，找到 `effect1` 和 `effect2`
- 通知这些副作用函数重新执行，获取最新的数据

这种链表结构使得一个响应式数据可以关联多个副作用函数，当数据变化时能够高效地通知所有相关函数进行更新。

