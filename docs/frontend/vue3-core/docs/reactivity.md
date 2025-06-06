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

### effect 嵌套问题

- 02-demo.html

```js
import { ref, effect } from '../dist/reactivity.esm.js'

const count = ref(0)

effect(() => {
  effect(() => {
    console.log('第二个effect执行了', count.value)
  })
  console.log('第一个effect执行了', count.value)
})

setTimeout(() => {
  count.value++
}, 1000)
```

![20250606095849](https://tuchuang.coder-sunshine.top/images/20250606095849.png)

可以看到如上打印顺序，为什么会这样呢？可以看到之前写的 effect 的逻辑

- effect.ts

```ts
export let activeSub

class ReactiveEffect {
  constructor(public fn) {}

  run() {
    // 将当前的 effect 保存到全局，以便于收集依赖
    activeSub = this
    try {
      return this.fn()
    } finally {
      activeSub = undefined // [!code focus]
    }
  }
}

export function effect(fn) {
  const effect = new ReactiveEffect(fn)
  effect.run()
}
```

> [!TIP] 当 `effect1` 执行的时候，`activeSub = effect1`，然后在 `effect1` 里面又创建了 `effect2`，此时执行 `effect2` 的 `run` 方法，这时 `activeSub` 就变成了 `effect2`，等 `effect2` 执行完后，`activeSub = undefined`，但是此时的 `effect1` 还没执行完，继续访问 `effect1` 的 ref，因为 `activeSub` 是 `undefined`，所以也不会继续收集依赖了，所以这里不能单纯的设置为 `undefined`，可以在 `activeSub = this` 之前，也就是在 fn 执行之前，先把 之前的 `effect` 保存起来，执行完毕之后，再把之前的赋值给 `activeSub`。

```ts
// 用来保存当前正在执行的 effect
// fn 调用，那么 fn 里面的依赖就会触发相应的 get set 操作等。就可以初步建立关联关系
export let activeSub

class ReactiveEffect {
  constructor(public fn) {}

  run() {
    // fn 执行之前，保存上一次的 activeSub，也就是保存外层的 activeSub，这样内层执行完毕，恢复外层的 activeSub，继续执行，就不会有问题了
    const prevSub = activeSub // [!code ++]

    // 将当前的 effect 保存到全局，以便于收集依赖
    activeSub = this
    try {
      return this.fn()
    } finally {
      activeSub = undefined // [!code --]
      activeSub = prevSub // [!code ++]
    }
  }
}

export function effect(fn) {
  const effect = new ReactiveEffect(fn)
  effect.run()
}
```

![20250606102151](https://tuchuang.coder-sunshine.top/images/20250606102151.png)

这样打印就正常了

### 调度器

调度器是响应式系统中一个重要的概念，我们默认使用 `effect` 访问响应式属性的时候，会收集依赖，当然我们修改响应式属性后，这个 `effect` 的 `fn` 会重新执行，而 `scheduler` 的作用是，当响应式数据发生变化的时候，执行 `scheduler`，而不是重新执行 `fn`，当然我们在创建 `effect` 的时候，还是会执行 `fn`，因为要靠它收集依赖，

```js
import { ref, effect } from '../../../node_modules/vue/dist/vue.esm-browser.js'
// import { ref, effect } from '../dist/reactivity.esm.js'

const count = ref(0)

const runner = effect(
  () => {
    console.log('effect执行了', count.value)
    return 123
  },
  {
    scheduler: () => {
      const newValue = runner()
      console.log('调度器执行了', newValue)
    },
  }
)

setTimeout(() => {
  count.value++
}, 1000)
```

![20250606142046](https://tuchuang.coder-sunshine.top/images/20250606142046.png)

可以看到官方实现中 effect 返回了一个 runner 函数，并且 effect 实例也在上面，如果 fn 中返回值，也可以通过 手动调用 runner 拿到值

- effect.ts

```ts
// 用来保存当前正在执行的 effect
// fn 调用，那么 fn 里面的依赖就会触发相应的 get set 操作等。就可以初步建立关联关系
export let activeSub

class ReactiveEffect {
  constructor(public fn) {}

  run() {
    // fn 执行之前，保存上一次的 activeSub，也就是保存外层的 activeSub，这样内层执行完毕，恢复外层的 activeSub，继续执行，就不会有问题了
    const prevSub = activeSub

    // 将当前的 effect 保存到全局，以便于收集依赖
    activeSub = this
    try {
      return this.fn()
    } finally {
      activeSub = prevSub
    }
  }

  /**
   * 通知更新的方法，如果依赖的数据发生了变化，会调用这个函数
   */
  notify() {
    // 具体调用 run 方法，还是调用用户传入的 options 中的 scheduler 方法 由用户决定, 默认调用 run 方法
    this.scheduler()
  }

  /**
   * 默认调用 run，如果用户传了，那以用户的为主，实例属性的优先级，优先于原型属性
   */
  scheduler() {
    this.run()
  }
}

export function effect(fn, options = {}) {
  const effect = new ReactiveEffect(fn)

  // 将传入的 options 合并到 effect 上，例如传了 { scheduler: fn },那么这个 scheduler 就会覆盖原型上的
  Object.assign(effect, options)

  effect.run()

  // 返回 runner 函数，可以手动执行
  // 两种写法都可以
  // const runner = () => effect.run()
  const runner = effect.run.bind(effect)
  runner.effect = effect
  return runner
}
```

- system.ts

> [!TIP] 修改sub执行方法改为统一调用 notify 方法

```ts
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
  queuedEffect.forEach(effect => effect.run()) // [!code --]
  queuedEffect.forEach(effect => effect.notify()) // [!code ++]
}
```
