import { activeSub } from './effect'
import { Link, link, propagate } from './system'

class Dep {
  // 订阅者链表的头节点
  subs?: Link
  // 订阅者链表的尾节点
  subsTail?: Link

  constructor() {}
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

  // 判断 target 是否是数组
  const isArray = Array.isArray(target)

  if (isArray) {
    /**
     * 更新数组的 length
     * 更新前：length = 4 => ['a', 'b', 'c', 'd']
     * 更新后：length = 2 => ['a', 'b']
     * 得出结论：要通知 访问了 c 和 d 的 effect 重新执行，就是访问了大于等于 length 的索引
     * depsMap = {
     *   0:Dep,
     *   1:Dep,
     *   2:Dep,
     *   3:Dep
     *   length:Dep
     * }
     */

    const length = target.length

    // 循环遍历 depsMap
    depsMap.forEach((dep, depKey) => {
      if (depKey >= length || depKey === 'length') {
        /**
         * 通知访问了大于等于 length 的索引的 effect 重新执行
         * 和 访问了 length 的 effect 重新执行
         */
        propagate(dep.subs)
      }
    })
  } else {
    const dep = depsMap.get(key)
    if (!dep) {
      return
    }

    // 通知 dep 对应的subs执行
    propagate(dep.subs)
  }
}
