// 用来保存当前正在执行的 effect

import { endTrack, Link, startTrack } from './system'

// fn 调用，那么 fn 里面的依赖就会触发相应的 get set 操作等。就可以初步建立关联关系
export let activeSub

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
