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
}

export function effect(fn) {
  const effect = new ReactiveEffect(fn)
  effect.run()
}
