import { ReactiveEffect } from './effect'
import { isRef } from './ref'

export function watch(source, cb) {
  let getter: () => any

  if (isRef(source)) {
    // 如果 source 是 ref，则构造 getter 函数直接返回 source.value 就行了
    getter = () => source.value
  }

  // 创建一个 effect， 接受处理好的 getter 函数
  const effect = new ReactiveEffect(getter)

  // 执行 getter 函数，收集依赖
  let oldValue = effect.run()

  // 创建一个 scheduler 函数，用于在数据变化时执行
  const job = () => {
    // 把新值老值传给 cb 函数,这里需要重新执行 run方法收集依赖。而不是用 getter 函数执行拿到结果
    // 因为有可能会出现分支切换等情况，需要重新收集依赖
    const newValue = effect.run()

    // 执行回调函数
    cb(newValue, oldValue)

    // 更新老值
    oldValue = newValue
  }

  // 覆盖 effect 原型上面的 scheduler 方法，在数据变化时执行 job 函数
  effect.scheduler = job

  // 返回一个 stop 方法，用于停止监听
  return () => {
    console.log('停止监听')
  }
}
