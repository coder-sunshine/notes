import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandler'

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
