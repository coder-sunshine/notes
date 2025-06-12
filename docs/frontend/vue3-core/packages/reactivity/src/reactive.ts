import { hasChanged, isObject } from '@vue/shared'
import { link, Link, propagate } from './system'
import { activeSub } from './effect'
import { isRef } from './ref'

class Dep {
  // 订阅者链表的头节点
  subs?: Link
  // 订阅者链表的尾节点
  subsTail?: Link

  constructor() {}
}

export function reactive(target) {
  return createReactiveObject(target)
}

/**
 * 保存 target 和 响应式对象之间的关联关系
 * target => proxy
 */
const reactiveMap = new WeakMap()

/**
 * 保存所有使用 reactive 创建出来的响应式对象
 */
const reactiveSet = new WeakSet()

const mutableHandlers = {
  get(target, key, receiver) {
    /**
     * 收集依赖
     * 绑定 target 中的某一个 key 和 sub 之间的关系
     */
    track(target, key)

    const res = Reflect.get(target, key, receiver)

    // ref 对象，需要返回 value
    if (isRef(res)) {
      return res.value
    }

    /**
     * 如果 res 是一个对象，那就包装成 reactive
     */
    if (isObject(res)) {
      return reactive(res)
    }

    return res
  },
  set(target, key, newValue, receiver) {
    // 拿到旧值
    const oldValue = target[key]

    /**
     * 如果更新了 state.count 它之前是个 ref，那么会修改原始的 ref.value 的值 等于 newValue
     * 如果 newValue 是一个 ref，那就不修改
     */

    if (isRef(oldValue) && !isRef(newValue)) {
      // 这里修改了 ref 的值，是会触发 ref 的 set的，直接走 ref 的更新逻辑就行，直接返回 true,
      // Reflect.set 放后面执行
      oldValue.value = newValue
      return true
    }

    // 这句代码执行之后，target[key] 的值就变成了 newValue， 顺序不能写反
    const res = Reflect.set(target, key, newValue, receiver)

    if (hasChanged(oldValue, newValue)) {
      /**
       * 触发更新， 设置值的时候，通知收集的依赖，重新执行
       * 先 set 然后再通知
       */
      trigger(target, key)
    }

    return res
  },
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

  // 如果已经创建过了，代表传入的就是一个 reactive 对象，则直接复用
  if (reactiveSet.has(target)) {
    return target
  }

  // 如果存在，直接复用
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  // 创建代理对象
  const proxy = new Proxy(target, mutableHandlers)

  /**
   * 保存 target 和 proxy 之间的关联关系
   * target => proxy , 如果再次创建 target 的代理对象，就可以复用了
   */
  reactiveMap.set(target, proxy)

  // 保存响应式对象到 reactiveSet
  reactiveSet.add(proxy)

  return proxy
}

const targetMap = new WeakMap()

export function track(target, key) {
  if (!activeSub) {
    return
  }

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
}

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
