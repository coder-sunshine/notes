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

### 节点复用问题

#### 单节点复用

```js
// import { ref, effect } from '../../../node_modules/vue/dist/vue.esm-browser.js'
import { ref, effect } from '../dist/reactivity.esm.js'

const flag = ref(false)

effect(() => {
  console.count('effect')
  console.log(flag.value)
})

btn.onclick = () => {
  flag.value = !flag.value
}
```

执行 `effect`，建立 `flag` 和 `effect` 的关联，当改变了 `flag` 的时候，那么触发 `effect` 的重新执行，但是此时 又会创建新的 link 节点，将 flag 和 effect 关联，也就导致了重复收集了。

- 第一次执行 effect
  ![20250610103356](https://tuchuang.coder-sunshine.top/images/20250610103356.png)

- 点击按钮
  ![20250610103419](https://tuchuang.coder-sunshine.top/images/20250610103419.png)
- 再点按钮
  ![20250610103434](https://tuchuang.coder-sunshine.top/images/20250610103434.png)
- 再点按钮
  ![20250610103447](https://tuchuang.coder-sunshine.top/images/20250610103447.png)

可以发现成指数级触发 effect。为什么呢？可以看下图
![20250610103838](https://tuchuang.coder-sunshine.top/images/20250610103838.png)

> [!TIP] 初始化执行，也就是 effect 第一次自动执行
> 当 `effect` 执行的时候，收集依赖，生成新的节点 `link1`，`flag` 的 `subs` 和 `subsTail` 都指向 `link1`，`link1` 的 `sub` 执行 `effect`

![20250610104930](https://tuchuang.coder-sunshine.top/images/20250610104930.png)

> [!TIP] 第一次点击
> 点击后找到 `link1` 对应的 `effect` 重新执行，那么此时 又访问到了 `flag.value`，此时又会进行依赖收集，导致又会创建新的节点,当再次点击的时候就会导致触发多个相同的 `effect`。

那应该怎样处理呢？

> [!TIP] 给 effect 添加 dep 的链表关系
> 可以想到，因为一直都是 `effect` 和 `flag` 之间关联，那么我们只需要去复用这个关联关系就行了，也就是复用 `link1`，当 `effect` 在执行的时候，可以想办法拿到当前 `effect` 关联的 响应式数据，然后再执行之前，判断下当前 `effect` 和 这个响应式数据有没有建立过对应关系，如果建立过了，那么就直接复用就行了。
> 可以给 `effect` 添加 `deps` 和 `depsTail` 的单向链表，来记录 `effect` 关联了哪些 响应式数据

- effect.ts

```ts
class ReactiveEffect {
  // 加一个单向链表（依赖项链表），在重新执行时可以找到自己之前收集到的依赖，尝试复用：

  /**
   * 依赖项链表的头节点
   */
  deps?: Link // [!code ++]

  /**
   * 依赖项链表的尾节点
   */
  depsTail?: Link // [!code ++]

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
```

- system.ts

```ts
/**
 * 订阅者
 */
export interface Subscriber {
  // 依赖项链表的头节点
  deps?: Link
  // 依赖项链表的尾节点
  depsTail?: Link
}
```

- system.ts

```ts{10-11,28-39}
/**
 * 建立dep和sub的关联
 * @param dep
 * @param sub
 */
export function link(dep: Dependency, sub: Subscriber) {
  // 创建一个节点
  const newLink: Link = {
    sub,
    dep, // link 关联的 响应式数据
    nextDep: undefined, // 下一个依赖项节点
    nextSub: undefined,
    prevSub: undefined,
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

  /**
   * 将链表节点和 sub 建立对应关系
   * 关联链表关系，分两种情况
   * 1. 尾节点有，那就往尾节点后面加
   * 2. 如果尾节点没有，则表示第一次关联，那就往头节点加，头尾相同
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = sub.depsTail = newLink
  }
}
```

![20250610142326](https://tuchuang.coder-sunshine.top/images/20250610142326.png)

现在关联关系已经建立好了。继续分析

- 当初始化执行的时候，会收集依赖，建立关系链表，第一次点击的时候，又会执行 `effect`，此时还是会**按照顺序执行**收集依赖，那么此时可以通过当前 `effect` 找到当前的头结点 `deps` ，看下 这个节点的 `dep` 是否就是 传入给 `link` 函数的 `dep`，如果相等，则代表需要收集的 `dep` 和 当前 effect 是可以复用的，那么就不创建新的节点了。

> [!TIP] 我们怎么才能知道它是重新执行，而不是第一次执行的呢？
> vue 官方的设计是 在 每次 `fn` 执行之前，将 当前 `effect` 的尾节点 设置为 `undefined`，这样重复执行的时候，**就看头结点有没有值，头没值，则是第一次执行，头结点有值，尾结点没值，就代表是重复执行的，那么就不创建新的节点，直接复用**

![20250610142432](https://tuchuang.coder-sunshine.top/images/20250610142432.png)

- effect.ts

```ts
class ReactiveEffect {
  // 加一个单向链表（依赖项链表），在重新执行时可以找到自己之前收集到的依赖，尝试复用：

  /**
   * 依赖项链表的头节点
   */
  deps?: Link

  /**
   * 依赖项链表的尾节点
   */
  depsTail?: Link

  constructor(public fn) {}

  run() {
    // fn 执行之前，保存上一次的 activeSub，也就是保存外层的 activeSub，这样内层执行完毕，恢复外层的 activeSub，继续执行，就不会有问题了
    const prevSub = activeSub

    // 将当前的 effect 保存到全局，以便于收集依赖
    activeSub = this

    /**
     * 当 effect 执行完毕后，会收集到依赖，可以这样，当 effect 被通知更新的时候，把 depsTail 设置成 undefined
     * 那么此时的 depsTail 指向 undefined，deps 指向 link1，这种情况下，可以视为它之前收集过依赖，(有头无尾巴，说明手动设置过了，不是新节点)
     * 在重新执行的时候，需要尝试着去复用，那么复用谁呢？肯定是先复用第一个，然后依次往后(也就是按照顺序执行)
     */

    // 这里在开始执行之前，将 depsTail 设置成 undefined
    this.depsTail = undefined // [!code ++]
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
```

- system.ts

```ts{7-19}
/**
 * 建立dep和sub的关联
 * @param dep
 * @param sub
 */
export function link(dep: Dependency, sub: Subscriber) {
  // 尝试复用节点
  const currentDep = sub.depsTail // 拿到当前的尾结点

  // 尾结点没值，头结点有值，说明需要复用
  if (!currentDep && sub.deps) {
    // 判断头结点的dep是否是当前的dep
    if (sub.deps.dep === dep) {
      console.log('复用当前头结点')
      sub.depsTail = sub.deps
      return
    }
  }
  console.log('创建新节点')
  // 创建一个节点
  const newLink: Link = {
    sub,
    dep, // link 关联的 响应式数据
    nextDep: undefined, // 下一个依赖项节点
    nextSub: undefined,
    prevSub: undefined,
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

  /**
   * 将链表节点和 sub 建立对应关系
   * 关联链表关系，分两种情况
   * 1. 尾节点有，那就往尾节点后面加
   * 2. 如果尾节点没有，则表示第一次关联，那就往头节点加，头尾相同
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = sub.depsTail = newLink
  }
}
```

![20250610140535](https://tuchuang.coder-sunshine.top/images/20250610140535.png)

可以看到 第一次是直接创建的新节点，后面就是一直复用当前头结点了

#### 多节点复用

```js
// import { ref, effect } from '../../../node_modules/vue/dist/vue.esm-browser.js'
import { ref, effect } from '../dist/reactivity.esm.js'

const flag = ref(false)
const count = ref(0)

const e = effect(() => {
  console.count('effect')
  console.log(flag.value)
  console.log(count.value)
})

btn.onclick = () => {
  count.value++
  console.dir(e)
}
```

- 初始化执行
  ![20250610153320](https://tuchuang.coder-sunshine.top/images/20250610153320.png)

- 第一次点击
  ![20250610153330](https://tuchuang.coder-sunshine.top/images/20250610153330.png)

- 第二次点击
  ![20250610153340](https://tuchuang.coder-sunshine.top/images/20250610153340.png)

- 第三次点击
  ![20250610153349](https://tuchuang.coder-sunshine.top/images/20250610153349.png)

![20250610150409](https://tuchuang.coder-sunshine.top/images/20250610150409.png)

- 如上图，此时复用是有问题，因为头结点 `link1` 此时是还有 `nextDep` 为 `link2` 的。

- 当初**始化执行完成**后，建立上面的链表关系图。也就是把**尾结点指向 undefined**

![20250610155935](https://tuchuang.coder-sunshine.top/images/20250610155935.png)

- 此时点击按钮后，触发 `effect` 重新执行，然后收集依赖，当执行到 `flag.value` 的时候，此时 `sub.depsTail` 为 `undefined`,并且 `sub.deps` 有值。并且 当前节点的 `dep` 就是 `flag` 所以可以复用。最后把 `sub` 的尾结点指向 `link1`

```ts
export function link(dep: Dependency, sub: Subscriber) {
  // 尝试复用节点
  const currentDep = sub.depsTail // 拿到当前的尾结点

  // 尾结点没值，头结点有值，说明需要复用
  if (!currentDep && sub.deps) {
    // 判断头结点的dep是否是当前的dep
    if (sub.deps.dep === dep) {
      console.log('复用当前头结点')
      sub.depsTail = sub.deps
      return
    }
  }
  console.log('创建新节点')
}
```

![20250610160510](https://tuchuang.coder-sunshine.top/images/20250610160510.png)

- 然后继续收集 `count`,此时 `currentDep` 就不是 `undefined` 了，而是 `link1`，那么就会直接创建新节点，而不是复用。就会走创建新节点的逻辑。

```ts
// 创建一个节点
const newLink: Link = {
  sub,
  dep, // link 关联的 响应式数据
  nextDep: undefined, // 下一个依赖项节点
  nextSub: undefined,
  prevSub: undefined,
}
```

首先走创建新节点的逻辑。
![20250610170617](https://tuchuang.coder-sunshine.top/images/20250610170617.png)

```ts{25-49}
export function link(dep: Dependency, sub: Subscriber) {
  // 尝试复用节点
  const currentDep = sub.depsTail // 拿到当前的尾结点

  // 尾结点没值，头结点有值，说明需要复用
  if (!currentDep && sub.deps) {
    // 判断头结点的dep是否是当前的dep
    if (sub.deps.dep === dep) {
      console.log('复用当前头结点')
      sub.depsTail = sub.deps
      return
    }
  }
  console.log('创建新节点')

  // 创建一个节点
  const newLink: Link = {
    sub,
    dep, // link 关联的 响应式数据
    nextDep: undefined, // 下一个依赖项节点
    nextSub: undefined,
    prevSub: undefined,
  }

  // 如果尾结点有，说明头结点肯定有
  if (dep.subsTail) {
    console.dir('dep', dep)
    // 把新节点加到尾结点
    dep.subsTail.nextSub = newLink
    // 把新节点 prevSub 指向原来的尾巴
    newLink.prevSub = dep.subsTail
    // 更新尾结点
    dep.subsTail = newLink
  } else {
    dep.subs = dep.subsTail = newLink
  }

  /**
   * 将链表节点和 sub 建立对应关系
   * 关联链表关系，分两种情况
   * 1. 尾节点有，那就往尾节点后面加
   * 2. 如果尾节点没有，则表示第一次关联，那就往头节点加，头尾相同
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = sub.depsTail = newLink
  }
}
```

当前 `dep` 是 `count`，`dep.subsTail` 也就是 `link2`。创建dep的关联

![20250610170954](https://tuchuang.coder-sunshine.top/images/20250610170954.png)

然后创建 sub 和 dep 的关联

![20250610171138](https://tuchuang.coder-sunshine.top/images/20250610171138.png)

此时可以看到，当 `count` 更新的时候，`count` 对应的 `link2`，还有 `nextSub` ，所以触发更新的时候，就会多次触发 `effect`。

> [!tip] 解决方案
> 可以判断一下，如果尾结点还有 `nextDep`，那么就复用尾结点的 `nextDep` 就行了。

```ts{7-24}
/**
 * 建立dep和sub的关联
 * @param dep
 * @param sub
 */
export function link(dep: Dependency, sub: Subscriber) {
  // 尝试复用节点
  const currentDep = sub.depsTail // 拿到当前的尾结点
  /**
   * 分两种情况：
   * 1. 如果头节点有，尾节点没有，那么尝试着复用头节点
   * 2. 如果尾节点还有 nextDep，尝试复用尾节点的 nextDep
   */

  // nextDep 为尝试复用的节点，如果尾节点为 undefined，那么就取头结点复用。
  // 如果尾节点有值，说明是多个节点，那么就取尾结点的下一个节点复用
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep

  // nextDep 没值，代表 头结点都没，需要新建节点
  if (nextDep && nextDep.dep === dep) {
    console.log('复用当前结点')
    sub.depsTail = nextDep
    return
  }

  console.log('创建新节点')

  // 创建一个节点
  const newLink: Link = {
    sub,
    dep, // link 关联的 响应式数据
    nextDep: undefined, // 下一个依赖项节点
    nextSub: undefined,
    prevSub: undefined,
  }

  // 如果尾结点有，说明头结点肯定有
  if (dep.subsTail) {
    console.dir('dep', dep)
    // 把新节点加到尾结点
    dep.subsTail.nextSub = newLink
    // 把新节点 prevSub 指向原来的尾巴
    newLink.prevSub = dep.subsTail
    // 更新尾结点
    dep.subsTail = newLink
  } else {
    dep.subs = dep.subsTail = newLink
  }

  /**
   * 将链表节点和 sub 建立对应关系
   * 关联链表关系，分两种情况
   * 1. 尾节点有，那就往尾节点后面加
   * 2. 如果尾节点没有，则表示第一次关联，那就往头节点加，头尾相同
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = sub.depsTail = newLink
  }
}
```

此时当收集 `count` 的时候，`sub.depsTail` 为 `link1`，

```ts
const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep
// nextDep 没值，代表 头结点都没，需要新建节点
if (nextDep && nextDep.dep === dep) {
  console.log('复用当前结点')
  sub.depsTail = nextDep
  return
}
```

`nextDep` 就为 `link2`， 并且 if 判断是成立的，就复用了。

![20250610175109](https://tuchuang.coder-sunshine.top/images/20250610175109.png)

此时就是点一次执行一次了。
![20250610175136](https://tuchuang.coder-sunshine.top/images/20250610175136.png)

> [!IMPORTANT] 总结
>
> **如果头节点有，尾节点没有，那么尝试着复用头节点**
>
> **如果头结点有，并且尾节点还有 `nextDep`，尝试复用尾节点的 `nextDep`**

### 分支切换和依赖清理

```js
// import {
//   ref,
//   effect,
// } from '../../../node_modules/vue/dist/vue.esm-browser.prod.js'
import { ref, effect } from '../dist/reactivity.esm.js'

const flag = ref(true)
const name = ref('sunshine')
const age = ref(18)

effect(() => {
  console.count('effect')
  // 需要根据 flag 的值， 来决定 effect 的依赖项是什么，把不需要的依赖给清理掉
  if (flag.value) {
    app.innerHTML = name.value
  } else {
    app.innerHTML = age.value
  }
})

flagBtn.onclick = () => {
  flag.value = !flag.value
}

nameBtn.onclick = () => {
  // 如果 flag 为 true，那么 name 就是依赖项，如果 flag 为 false，那么 name 就不是依赖项，需要清理掉
  name.value = name.value + Math.random()
}

ageBtn.onclick = () => {
  // 如果 flag 为 true，那么 age 就是依赖项，如果 flag 为 false，那么 age 就不是依赖项，需要清理掉
  age.value++
}
```

上面这段代码初始化展示的是名字，点击按钮修改名字不会有问题，问题在于当修改了 `flag` 为 `false` 后,在修改年龄没问题，但是此时修改名字,由于 `effect` 中之前 `flag` 为 `true`,所以也会收集对应依赖，所以 `effect` 还是会继续执行，**也就是切换分支后，之前依赖没有被清理掉**

- **初始化后的关系图，此时只收集到了 flag 和 name 的依赖**

![20250611100228](https://tuchuang.coder-sunshine.top/images/20250611100228.png)

- 点击 `update flag` 后改为 `false`, 触发 `effect` 重新执行，此时尾结点 指向 `undefined`。

![20250611100526](https://tuchuang.coder-sunshine.top/images/20250611100526.png)

- 然后执行 `link` 函数，尝试复用节点，`link1` 能复用上

![20250611100747](https://tuchuang.coder-sunshine.top/images/20250611100747.png)

- 此时 `depsTail` 为 `link1`,也有 `nextDep`，但是此时 `dep` 为 `age`（因为`flag` 为`false`,分支切换了）。和 `link2` 的 `dep` 对应的 `name` 不相同，所以不能复用， 需要创建新的节点。

![20250611101915](https://tuchuang.coder-sunshine.top/images/20250611101915.png)

创建新的节点 age，

```ts
if (sub.depsTail) {
  sub.depsTail.nextDep = newLink
  sub.depsTail = newLink
} else {
  sub.deps = sub.depsTail = newLink
}
```

> [!WARNING] 分析
> 此时 `link1` 的 `nextDep` 指向 `link2`，`sub` 的 `depsTail` 指向 `link2`。可以看到 `effect` 的 `dep` 链表里面已经没有 `name` 了，但是当修改 name 的值后，还是可以通过 name 对应的 link2 的 sub 找到 effect 重新执行。

想办法清理对应的依赖，使其不重新执行

> [!IMPORTANT] 解决方案
> 在创建新节点的时候，把新节点的 nextDep 赋值为 上一个没有复用上的节点。其他照旧执行，那么最后 depsTail 的 nextDep 就是需要被清理的依赖。

![20250611102908](https://tuchuang.coder-sunshine.top/images/20250611102908.png)

- system.ts

```ts
// 创建一个节点
const newLink: Link = {
  sub,
  dep, // link 关联的 响应式数据
  nextDep: undefined, // 下一个依赖项节点 [!code --]
  nextDep, // 将没复用上的节点作为新节点的 nextDep [!code ++]
  nextSub: undefined,
  prevSub: undefined,
}
```

- effect.ts

```ts
run() {
    // fn 执行之前，保存上一次的 activeSub，也就是保存外层的 activeSub，这样内层执行完毕，恢复外层的 activeSub，继续执行，就不会有问题了
    const prevSub = activeSub

    // 将当前的 effect 保存到全局，以便于收集依赖
    activeSub = this

    /**
     * 当 effect 执行完毕后，会收集到依赖，可以这样，当 effect 被通知更新的时候，把 depsTail 设置成 undefined
     * 那么此时的 depsTail 指向 undefined，deps 指向 link1，这种情况下，可以视为它之前收集过依赖，(有头无尾巴，说明手动设置过了，不是新节点)
     * 在重新执行的时候，需要尝试着去复用，那么复用谁呢？肯定是先复用第一个，然后依次往后(也就是按照顺序执行)
     */

    // 这里在开始执行之前，将 depsTail 设置成 undefined
    this.depsTail = undefined
    try {
      return this.fn()
    } finally {
      if(this.depsTail.nextDep) {
        console.log('需要被清理的依赖', this.depsTail.nextDep)
      }
      activeSub = prevSub
    }
  }
```

- 点击 flag，可以看到需要被清理的依赖是 name

![20250611104236](https://tuchuang.coder-sunshine.top/images/20250611104236.png)

- 再次点击，可以发现需要被清理的是 age

![20250611104325](https://tuchuang.coder-sunshine.top/images/20250611104325.png)

- 还有一种情况是，当头结点有，尾节点没有，那么需要清理所有的依赖

```js
// import {
//   ref,
//   effect,
// } from '../../../node_modules/vue/dist/vue.esm-browser.prod.js'
import { ref, effect } from '../dist/reactivity.esm.js'

const flag = ref(true)
const name = ref('sunshine')
const age = ref(18)

let count = 0

effect(() => {
  console.count('effect')

  if (count > 0) {
    return
  }
  count++
  // 需要根据 flag 的值， 来决定 effect 的依赖项是什么，把不需要的依赖给清理掉
  if (flag.value) {
    app.innerHTML = name.value
  } else {
    app.innerHTML = age.value
  }
})

flagBtn.onclick = () => {
  flag.value = !flag.value
}

nameBtn.onclick = () => {
  // 如果 flag 为 true，那么 name 就是依赖项，如果 flag 为 false，那么 name 就不是依赖项，需要清理掉
  name.value = name.value + Math.random()
}

ageBtn.onclick = () => {
  // 如果 flag 为 true，那么 age 就是依赖项，如果 flag 为 false，那么 age 就不是依赖项，需要清理掉
  age.value++
}
```

- system.ts

```ts
run() {
    // fn 执行之前，保存上一次的 activeSub，也就是保存外层的 activeSub，这样内层执行完毕，恢复外层的 activeSub，继续执行，就不会有问题了
    const prevSub = activeSub

    // 将当前的 effect 保存到全局，以便于收集依赖
    activeSub = this

    /**
     * 当 effect 执行完毕后，会收集到依赖，可以这样，当 effect 被通知更新的时候，把 depsTail 设置成 undefined
     * 那么此时的 depsTail 指向 undefined，deps 指向 link1，这种情况下，可以视为它之前收集过依赖，(有头无尾巴，说明手动设置过了，不是新节点)
     * 在重新执行的时候，需要尝试着去复用，那么复用谁呢？肯定是先复用第一个，然后依次往后(也就是按照顺序执行)
     */

    // 这里在开始执行之前，将 depsTail 设置成 undefined
    this.depsTail = undefined
    try {
      return this.fn()
    } finally {
      if (this.depsTail) {
        if (this.depsTail.nextDep) {
          console.log('需要被清理的依赖', this.depsTail.nextDep)
        }
      } else if (this.deps) {
        console.log('需要被清理的依赖', this.deps)
      }
      activeSub = prevSub
    }
  }
```

也就是 `count` 大于 0 后，后面的依赖就收集不到了。
![20250611111408](https://tuchuang.coder-sunshine.top/images/20250611111408.png)

**这个时候就找到了需要被清理的依赖了，然后处理就行了**

![20250611144242](https://tuchuang.coder-sunshine.top/images/20250611144242.png)

当 `name` 有可能依赖多个 `effect`，只能清理掉和当前 `effect` 的关系，不能乱清理

- effect.ts

```ts{14,19-20}
run() {
    // fn 执行之前，保存上一次的 activeSub，也就是保存外层的 activeSub，这样内层执行完毕，恢复外层的 activeSub，继续执行，就不会有问题了
    const prevSub = activeSub

    // 将当前的 effect 保存到全局，以便于收集依赖
    activeSub = this

    /**
     * 当 effect 执行完毕后，会收集到依赖，可以这样，当 effect 被通知更新的时候，把 depsTail 设置成 undefined
     * 那么此时的 depsTail 指向 undefined，deps 指向 link1，这种情况下，可以视为它之前收集过依赖，(有头无尾巴，说明手动设置过了，不是新节点)
     * 在重新执行的时候，需要尝试着去复用，那么复用谁呢？肯定是先复用第一个，然后依次往后(也就是按照顺序执行)
     */

    startTrack(this)

    try {
      return this.fn()
    } finally {
      // 结束追踪，找到需要清理的依赖，断开关联关系
      endTrack(this)

      activeSub = prevSub
    }
  }
```

fn 执行之前还是 将 尾结点 设置尾 `undefined`，执行完后 就开始 清理依赖

- system.ts

```ts
/**
 * 开始追踪依赖，将depsTail，尾节点设置成 undefined
 * @param sub
 */
export function startTrack(sub: Subscriber) {
  sub.depsTail = undefined
}

/**
 * 结束追踪，找到需要清理的依赖，断开关联关系
 * @param sub
 */
export function endTrack(sub: Subscriber) {
  const depsTail = sub.depsTail

  /**
   * depsTail 有，并且 depsTail 还有 nextDep ，就把它们的依赖关系清理掉
   * depsTail 没有，并且头节点有，那就把所有的都清理掉（这个是没有收集到依赖，比如在 effect 第一句写个判断，为真执行下面，为假直接return ，那么后面就不用收集依赖了 ）
   */

  if (depsTail) {
    if (depsTail.nextDep) {
      // 将需要清理的依赖传进去
      clearTracking(depsTail.nextDep)
      // 清理完毕后，将 depsTail.nextDep 设置成 undefined
      depsTail.nextDep = undefined
    }
  } else if (sub.deps) {
    clearTracking(sub.deps)
    // 清理完毕后，将 sub.deps 设置成 undefined
    sub.deps = undefined
  }
}
```

```ts
/**
 * 清理依赖关系
 * @param link
 */
function clearTracking(link: Link) {
  // 清理依赖
  while (link) {
    const { dep, nextDep, nextSub, prevSub } = link

    // 如果当前 link 的 prevSub 有值，则代表不是头节点，则把上一个的 nextSub 指向 link 的 nextSub
    if (prevSub) {
      // 把上一个的 nextSub 指向 link 的 nextSub
      prevSub.nextSub = nextSub
      // 把 link 的 nextSub 断开
      link.nextSub = undefined
    } else {
      // prevSub 没值，则代表是头节点，则把头结点指向 nextSub
      dep.subs = nextSub
    }

    // 如果下一个有，那就把 nextSub 的上一个节点，指向当前节点的上一个节点
    if (nextSub) {
      nextSub.prevSub = prevSub
      // 断开 link 的 prevSub
      link.prevSub = undefined
    } else {
      // 如果下一个没有，那它就是尾节点，把 dep.depsTail 指向上一个节点
      dep.subsTail = prevSub
    }

    // 最后断开 link 的 dep sub 以及 nextDep
    link.dep = link.sub = undefined
    link.nextDep = undefined

    link = nextDep
  }
}
```

![20250611144242](https://tuchuang.coder-sunshine.top/images/20250611144242.png)

- 分几种情况

  1. 上一个节点有值，也就是 `link` 的 `prevSub` 有值，则代表不是头结点，则把上一个的 `nextSub` 指向 `link` 的 `nextSub`,然后断开 `link` 的 `nextSub`
  2. 上一个节点没值，则代表是头结点，直接把头结点指向 `nextSub` 就行了
  3. 下一个节点有值，也就是 `link` 的 `nextSub` 有值，那就把 `nextSub` 的上一个节点，指向当前节点的上一个节点,然后断开 `link` 的 `prevSub`。
  4. 下一个节点没值，则代表是尾节点，则把尾节点指向上一个节点就行了，也就是 `prevSub`

- 最后断开 `link` 的 `dep` `sub` 以及 `nextDep` 之间的关联，然后开始下一轮循环

这样过后 当切换 `flag` 过后，只会触发对应的依赖了，点击其他按钮不会触发 `effect` 重新执行

![20250611153634](https://tuchuang.coder-sunshine.top/images/20250611153634.png)

当 `count` 大于 0 这种情况，时候，也只会触发两次 `effect` 执行，初始化一次，点击按钮后一次，第二次就收集不到依赖了，后面就一直不触发了

> [!IMPORTANT] 总结 - 为何需要清理依赖
> 内存管理：防止内存泄漏
>
> 性能优化：避免不必要的更新计算
>
> 确保正确性：保证响应式系统的依赖关系准确性

### linkPool 链表节点复用

```js
import { ref, effect } from '../dist/reactivity.esm.js'

const flag = ref(true)
const name = ref('sunshine')
const age = ref(18)

// let count = 0

effect(() => {
  console.count('effect')

  // if (count > 0) {
  //   return
  // }
  // count++
  // 需要根据 flag 的值， 来决定 effect 的依赖项是什么，把不需要的依赖给清理掉
  if (flag.value) {
    app.innerHTML = name.value
  } else {
    app.innerHTML = age.value
  }
})

flagBtn.onclick = () => {
  flag.value = !flag.value
}

nameBtn.onclick = () => {
  // 如果 flag 为 true，那么 name 就是依赖项，如果 flag 为 false，那么 name 就不是依赖项，需要清理掉
  name.value = name.value + Math.random()
}

ageBtn.onclick = () => {
  // 如果 flag 为 true，那么 age 就是依赖项，如果 flag 为 false，那么 age 就不是依赖项，需要清理掉
  age.value++
}
```

可以看到当 flag 一直切换时，会不停的清理依赖和创建新的节点，可以把清理后的依赖给保存下来，创建的时候就不创建新的了，直接用之前保存的。

- ststem.ts

```ts
/**
 * 清理依赖关系
 * @param link
 */
function clearTracking(link: Link) {
  // 清理依赖
  while (link) {
    const { dep, nextDep, nextSub, prevSub } = link

    // 如果当前 link 的 prevSub 有值，则代表不是头节点，则把上一个的 nextSub 指向 link 的 nextSub
    if (prevSub) {
      // 把上一个的 nextSub 指向 link 的 nextSub
      prevSub.nextSub = nextSub
      // 把 link 的 nextSub 断开
      link.nextSub = undefined
    } else {
      // prevSub 没值，则代表是头节点，则把头结点指向 nextSub
      dep.subs = nextSub
    }

    // 如果下一个有，那就把 nextSub 的上一个节点，指向当前节点的上一个节点
    if (nextSub) {
      nextSub.prevSub = prevSub
      // 断开 link 的 prevSub
      link.prevSub = undefined
    } else {
      // 如果下一个没有，那它就是尾节点，把 dep.depsTail 指向上一个节点
      dep.subsTail = prevSub
    }

    // 最后断开 link 的 dep sub 以及 nextDep
    link.dep = link.sub = undefined

    // 把 link.nextDep 指向linkPool，不写这个的话 有多个依赖，while循环的时候 等于 linkPool 永远就只有 link 节点一个了, 如果要复用多个就不行了
    link.nextDep = undefined // [!code --]
    link.nextDep = linkPool // [!code ++]

    // linkPool 保存 被清理掉的 link
    linkPool = link // [!code ++]

    link = nextDep
  }
}
```

在清理依赖的时候将需要被清理的依赖保存到 `linkPool` 中

```ts{25-55}
/**
 * 建立dep和sub的关联
 * @param dep
 * @param sub
 */
export function link(dep: Dependency, sub: Subscriber) {
  // 尝试复用节点
  const currentDep = sub.depsTail // 拿到当前的尾结点
  /**
   * 分两种情况：
   * 1. 如果头节点有，尾节点没有，那么尝试着复用头节点
   * 2. 如果尾节点还有 nextDep，尝试复用尾节点的 nextDep
   */

  // nextDep 为尝试复用的节点，如果尾节点为 undefined，那么就取头结点复用。
  // 如果尾节点有值，说明是多个节点，那么就取尾结点的下一个节点复用
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep

  // nextDep 没值，代表 头结点都没，需要新建节点
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  // 创建节点之前，看看能不能复用上 linkPool
  let newLink: Link = undefined

  if (linkPool) {
    // 复用 linkPool
    newLink = linkPool
    // 把linkPool设置为linkPool中的下一个依赖
    linkPool = linkPool.nextDep
    // nextDep 等于没有复用掉的 dep
    newLink.nextDep = nextDep
    newLink.sub = sub
    newLink.dep = dep
  } else {
    // 如果没有，就创建新的
    newLink = {
      sub,
      dep,
      nextDep,
      nextSub: undefined,
      prevSub: undefined,
    }
  }

  // // 创建一个节点
  // const newLink: Link = {
  //   sub,
  //   dep, // link 关联的 响应式数据
  //   nextDep, // 将没复用上的节点作为新节点的 nextDep
  //   nextSub: undefined,
  //   prevSub: undefined,
  // }

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

  /**
   * 将链表节点和 sub 建立对应关系
   * 关联链表关系，分两种情况
   * 1. 尾节点有，那就往尾节点后面加
   * 2. 如果尾节点没有，则表示第一次关联，那就往头节点加，头尾相同
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = sub.depsTail = newLink
  }
}
```

创建的时候看 `linkPool` 是否有值， 有值则复用 `linkPool`。

### 处理无限递归调用问题

```js
import { ref, effect } from '../dist/reactivity.esm.js'

const count = ref(0)

effect(() => {
  console.log(count.value++)
})
```

![20250612095830](https://tuchuang.coder-sunshine.top/images/20250612095830.png)

直接栈溢出了，因为 `effect` 里面在修改 `count` 的值，又会触发更新，又修改，更新，死循环了。

**可以给 `effect` 加一个 标记，标识当前 `effect` 是否正在收集依赖，如果在收集依赖，那就不触发 `effect` 执行。**

- effect.ts

```ts{14-18}
class ReactiveEffect {
  // 加一个单向链表（依赖项链表），在重新执行时可以找到自己之前收集到的依赖，尝试复用：

  /**
   * 依赖项链表的头节点
   */
  deps?: Link

  /**
   * 依赖项链表的尾节点
   */
  depsTail?: Link

  /**
   * 是否正在触发，startTrack 的时候设置为 true, endTrack 的时候设置为 false
   * 触发更新的时候，根据 tracking 判断是否需要执行 effect
   */
  tracking = false

  constructor(public fn) {}
  // ...
}
```

- system.ts

```ts
/**
 * 订阅者
 */
export interface Subscriber {
  // 依赖项链表的头节点
  deps?: Link
  // 依赖项链表的尾节点
  depsTail?: Link

  // 是否在收集依赖，在收集依赖的时候，不触发 effect 执行
  tracking: boolean // [!code ++]
}

/**
 * 开始追踪依赖，将tracking设置为true，将depsTail，尾节点设置成 undefined
 * @param sub
 */
export function startTrack(sub: Subscriber) {
  sub.tracking = true
  sub.depsTail = undefined
}

/**
 * 结束追踪，将tracking设置为false，找到需要清理的依赖，断开关联关系
 * @param sub
 */
export function endTrack(sub: Subscriber) {
  sub.tracking = false
  // ...
}
```

然后再传播更新的时候判断是否需要执行

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
    queuedEffect.push(link.sub) // [!code --]

    const sub = link.sub // [!code ++]
    // 如果sub正在收集依赖，则不触发effect执行
    if (!sub.tracking) {
      // [!code ++]
      // [!code ++]
      queuedEffect.push(sub) // [!code ++]
    } // [!code ++]

    link = link.nextSub
  }

  // 拿到所有的sub执行
  queuedEffect.forEach(effect => effect.notify())
}
```

### reactive 实现

`reactive` 接收一个对象,`vue3`是使用 `proxy` 去代理然后触发 `get` 和 `set` 来实现响应式的。

- shared/src/general.ts

```ts
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'
```

- reactive.ts

```ts
import { isObject } from '@vue/shared'

export function reactive(target: object) {
  return createReactiveObject(target)
}

/**
 * 创建响应式对象
 * @param target 目标对象
 * @returns 返回代理对象
 */
export function createReactiveObject(target) {
  // 如果不是对象，直接返回
  if (!isObject(target)) {
    return target
  }

  // 创建代理对象
  const proxy = new Proxy(target, {
    get(target, key) {
      /**
       * 收集依赖
       * 绑定 target 中的某一个 key 和 sub 之间的关系
       */
      track(target, key)

      return Reflect.get(target, key)
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value)

      /**
       * 触发更新， 设置值的时候，通知收集的依赖，重新执行
       * 先 set 然后再通知
       */
      trigger(target, key)

      return res
    },
  })

  return proxy
}

export function track(target, key) {
  console.log('track', target, key)
}

export function trigger(target, key) {
  console.log('trigger', target, key)
}
```

- 收集依赖
  之前是在 link 函数里面去建立对应关系节点，传入了 dep 和 sub，但是 目前 track 函数里面只能拿到 activeSub，还差一个 dep 参数，之前 RefImpl 上面挂载了 deps 和 depsTail，现在可以模仿着构造一个 dep 出来就行了

```ts
class Dep {
  // 订阅者链表的头节点
  subs?: Link
  // 订阅者链表的尾节点
  subsTail?: Link

  constructor() {}
}

export function track(target, key) {
  // 收集依赖，之前是在 link 函数里面，传了 dep 和 sub，现在 这里只能拿到 activeSub，还差 dep
  // 之前 RefImpl 就是 dep，上面有 deps 和 depsTail，现在可以再构造一个 dep，也实现这两个

  /** 这样去处理就行了
   * const dep = new Dep()
   * link(dep, activeSub)
   */

  console.log('track', target, key)
}
```

那这个 `dep` 要怎样串起来呢？可以用 `map` 结构来保存 `target` 和 `key` 之间的关联关系，再用 `map` 结构保存 `key` 和 `dep` 之间的关联就行了。这样在触发 更新的时候，就可以通过 `target` 和 `key` 找到对应的 `dep`，然后触发 `dep` 的 `sub` 重新执行就行了

- **targetMap:** 存储所有响应式对象的依赖关系
- **depsMap:** 存储某个对象的所有属性依赖
- **dep:** 存储某个属性的所有订阅者

**伪代码如下**

```js
const obj = {
  a: 1,
  b: 2,
}

targetMap = {
  [obj]: {
    a: Dep,
    b: Dep,
  },
}

depsMap = {
  a: Dep,
  b: Dep,
}
```

> [!TIP] targetMap 为什么需要使用 weakMap?
>
> 1. `WeakMap` 是一种键值对的集合，其中的键**必须是对象或非全局注册的符号**，并且不会创建对键的强引用，**换句话说，一个对象作为 `WeakMap` 的键存在，不会阻止该对象被垃圾回收**。
> 2. `WeakMap` 只能做映射，不能做遍历这些操作，也没有 `size`

> [!TIP] depsMap 为啥不用 weakMap呢？
>
> 1. 因为 `WeakMap` 的键必须是**对象或非全局注册的符号**, `reactive` 接受的是一个对象，不能保证 `key` 是一个对象，所以得用 `map` 才行

- reactive.ts

```ts
export function track(target, key) {
  // 收集依赖，之前是在 link 函数里面，传了 dep 和 sub，现在 这里只能拿到 activeSub，还差 dep
  // 之前 RefImpl 就是 dep，上面有 deps 和 depsTail，现在可以再构造一个 dep，也实现这两个

  /**
   * const dep = new Dep()
   * link(dep, activeSub)
   */

  // 通过 targetMap 获取 depsMap
  let depsMap = targetMap.get(target)

  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }

  // 通过 depsMap 获取 dep
  let dep = depsMap.get(key)

  if (!dep) {
    depsMap.set(key, (dep = new Dep()))
  }

  // 绑定 dep 和 sub 的关系
  link(dep, activeSub)
  console.log(targetMap)
}
```

```js
import { ref, effect, reactive } from '../dist/reactivity.esm.js'

const state = reactive({
  a: 0,
  b: 1,
})

effect(() => {
  console.log(state.a++)
})
```

![20250612140717](https://tuchuang.coder-sunshine.top/images/20250612140717.png)

- 触发更新
  触发更新就比较简单了,直接从 `targetMap` 中通过 `target` 和 `key` 找到对应的 `dep`，然后触发更新就行了。

```ts
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return
  }

  const dep = depsMap.get(key)
  if (!dep) {
    return
  }

  // 通知 dep 对应的subs执行
  propagate(dep.subs)
}
```

![20250612144043](https://tuchuang.coder-sunshine.top/images/20250612144043.png)

![20250612144054](https://tuchuang.coder-sunshine.top/images/20250612144054.png)

报错了 说明 `activeSub` 没值，处理下收集依赖的时候，`activeSub` 没值就不收集

```ts
export function track(target, key) {
  if (!activeSub) {
    return
  }
  // ...
}
```

![20250612144233](https://tuchuang.coder-sunshine.top/images/20250612144233.png)

这样就实现了一个最简单的 `reactive` 了。接下来处理一些细节上的问题

### reactive 细节处理

#### 处理 this 指向问题

```js
import { ref, effect, reactive } from '../dist/reactivity.esm.js'

const state = reactive({
  a: 0,
  b: 1,
  get sum() {
    console.log(this)
    return this.a + this.b
  },
})

effect(() => {
  console.log(state.sum)
})

setTimeout(() => {
  state.a++
}, 1000)
```

![20250612145054](https://tuchuang.coder-sunshine.top/images/20250612145054.png)

可以看到当定时器执行后，`effect` 并没有重新执行。可以从下面的例子来思考

```js
const obj = {
  a: 1,
  b: 2,
  get sum() {
    console.log('this', this)
    return this.a + this.b
  },
}

const proxy = new Proxy(obj, {
  get(target, key, receiver) {
    // 打印 key 发现 只打印了 sum，并没有打印 a 和 b，说明 a 和 b 没有被 get 拦截到
    console.log('key', key)
    return target[key]
  },
  set(target, key, value, receiver) {
    target[key] = value
  },
})

console.log(proxy.sum)
```

![20250612145520](https://tuchuang.coder-sunshine.top/images/20250612145520.png)

- 可以看到执行结果如下
- key sum
- this { a: 1, b: 2, sum: [Getter] } 这里的 this 是 obj， **因为 obj 并不是代理对象，所以 a 和 b 不会被 get 拦截到，我们需要做的就是把 this 指向代理对象**
- 3

> [!Tip] Reflect -> 完成对象的基本操作
> 可以使用 `Reflect` 搭配 `receiver` 来处理 this 指向问题

```js
const obj1 = {
  a: 1,
  b: 2,
  get sum() {
    console.log('this', this)
    return this.a + this.b
  },
}

const proxy1 = new Proxy(obj1, {
  get(target, key, receiver) {
    console.log('receiver', receiver === proxy1)
    console.log('key', key)
    return Reflect.get(target, key, receiver)
  },
  set(target, key, value, receiver) {
    return Reflect.set(target, key, value, receiver)
  },
})

console.log(proxy1.sum)
```

![20250612152553](https://tuchuang.coder-sunshine.top/images/20250612152553.png)

可以从执行结果中发现，此时的 `a` 和 `b` 已经被 `get` 给拦截到了，可以联想到 `vue` 源码中，当拦截到后就可以进行依赖收集了，后面再出发更新操作。这里的 `receiver` 和代理对象是相等的。

```ts{14,21,23-24}
/**
 * 创建响应式对象
 * @param target 目标对象
 * @returns 返回代理对象
 */
export function createReactiveObject(target) {
  // 如果不是对象，直接返回
  if (!isObject(target)) {
    return target
  }

  // 创建代理对象
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      /**
       * 收集依赖
       * 绑定 target 中的某一个 key 和 sub 之间的关系
       */
      track(target, key)

      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver)

      /**
       * 触发更新， 设置值的时候，通知收集的依赖，重新执行
       * 先 set 然后再通知
       */
      trigger(target, key)

      return res
    },
  })

  return proxy
}
```

在 get 和 set 中添加上 receiver 参数就可以了

![20250612153031](https://tuchuang.coder-sunshine.top/images/20250612153031.png)

#### 处理重复代理 target 的问题

```js
import { ref, effect, reactive } from '../dist/reactivity.esm.js'

const obj = reactive({
  a: 0,
  b: 1,
  c: 2,
})

const state1 = reactive(obj)
const state2 = reactive(obj)

console.log(state1 === state2)

effect(() => {
  console.log(obj.a)
})

setTimeout(() => {
  obj.a++
}, 1000)
```

![20250612153610](https://tuchuang.coder-sunshine.top/images/20250612153610.png)

可以看到 state1 并不等于 state2，可以再创建 reactive 的时候，使用 weakMap 保存起来，然后在后面创建的时候判断是否存在，存在直接复用，不存在新建。

```ts{1-5,18-22,48-52}
/**
 * 保存 target 和 响应式对象之间的关联关系
 * target => proxy
 */
const reactiveMap = new WeakMap()

/**
 * 创建响应式对象
 * @param target 目标对象
 * @returns 返回代理对象
 */
export function createReactiveObject(target) {
  // 如果不是对象，直接返回
  if (!isObject(target)) {
    return target
  }

  // 如果存在，直接复用
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 创建代理对象
  const proxy = new Proxy(target, {
    get(target, key, receiver) {
      /**
       * 收集依赖
       * 绑定 target 中的某一个 key 和 sub 之间的关系
       */
      track(target, key)

      return Reflect.get(target, key, receiver)
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver)

      /**
       * 触发更新， 设置值的时候，通知收集的依赖，重新执行
       * 先 set 然后再通知
       */
      trigger(target, key)

      return res
    },
  })

  /**
   * 保存 target 和 proxy 之间的关联关系
   * target => proxy , 如果再次创建 target 的代理对象，就可以复用了
   */
  reactiveMap.set(target, proxy)

  return proxy
}
```

这样就可以直接复用了

![20250612153951](https://tuchuang.coder-sunshine.top/images/20250612153951.png)

#### 处理代理复用的问题

```js
import { ref, effect, reactive } from '../dist/reactivity.esm.js'

const obj = reactive({
  a: 0,
  b: 1,
  c: 2,
})

const state1 = reactive(obj)
const state2 = reactive(state1)

console.log(state1 === state2)

effect(() => {
  console.log(obj.a)
})

setTimeout(() => {
  obj.a++
}, 1000)
```

![20250612154731](https://tuchuang.coder-sunshine.top/images/20250612154731.png)

可以看到当把 `state1` 作为 `reactive` 参数传入的时候，`state1 !== state2` 了，这种情况下，需要直接复用之前的代理对象才行。

创建一个 reactiveSet，创建一个 reactive 就保存一个，创建之前尝试复用

```ts
/**
 * 保存所有使用 reactive 创建出来的响应式对象
 */
const reactiveSet = new WeakSet()

/**
 * 创建响应式对象
 * @param target 目标对象
 * @returns 返回代理对象
 */
export function createReactiveObject(target) {
  // ...
  // 如果已经创建过了，代表传入的就是一个 reactive 对象，则直接复用
  if (reactiveSet.has(target)) {
    return target
  }

  // ...

  // 保存响应式对象到 reactiveSet
  reactiveSet.add(proxy)

  // ...
}
```

![20250612155815](https://tuchuang.coder-sunshine.top/images/20250612155815.png)
