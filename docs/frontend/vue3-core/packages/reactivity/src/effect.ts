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
