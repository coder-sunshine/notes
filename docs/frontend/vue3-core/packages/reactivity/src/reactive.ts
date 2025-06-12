import { isObject } from '@vue/shared'
import { link, Link, propagate } from './system'
import { activeSub } from './effect'

class Dep {
  // 订阅者链表的头节点
  subs?: Link
  // 订阅者链表的尾节点
  subsTail?: Link

  constructor() {}
}

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
