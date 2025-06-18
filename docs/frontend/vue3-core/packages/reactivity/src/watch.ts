import { isFunction, isObject } from '@vue/shared'
import { ReactiveEffect } from './effect'
import { isRef } from './ref'
import { isReactive } from './reactive'

export function watch(source, cb, options) {
  let { immediate, once, deep } = options

  if (once) {
    // 保存原来的 cb
    const _cb = cb
    // 重写 cb 函数，执行一次后，调用 stop 函数
    cb = (...args) => {
      _cb(...args)
      stop()
    }
  }

  let getter: () => any

  if (isRef(source)) {
    // 如果 source 是 ref，则构造 getter 函数直接返回 source.value 就行了
    getter = () => source.value
  } else if (isReactive(source)) {
    // 如果 source 是 reactive，则构造 getter 函数直接返回 source 就行了
    getter = () => source
    // deep默认为true
    if (deep === undefined) {
      deep = true
    }

    // deep 传了 false 或者 0  都设置为 1
    if (deep === false || deep === 0) {
      deep = 1
    }
  } else if (isFunction(source)) {
    // 如果 source 是函数，那么直接赋值
    getter = source
  }

  // deep 传了就递归收集所有的依赖，只要访问一下，就会收集依赖了，
  if (deep) {
    const baseGetter = getter

    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }

  // 创建一个 effect， 接受处理好的 getter 函数
  const effect = new ReactiveEffect(getter)

  // 初始化为 undefined
  let oldValue = undefined

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

  if (immediate) {
    // 这个时候 oldValue 是 undefined
    job()
  } else {
    oldValue = effect.run()
  }

  // 覆盖 effect 原型上面的 scheduler 方法，在数据变化时执行 job 函数
  effect.scheduler = job

  const stop = () => effect.stop()

  // 返回一个 stop 方法，用于停止监听
  return stop
}

function traverse(value, depth = Infinity, seen = new Set()) {
  // 如果不是对象，直接返回当前值
  if (!isObject(value) || depth <= 0) {
    return value
  }

  // 如果已经访问过了，直接返回就行了
  if (seen.has(value)) {
    return value
  }

  seen.add(value)

  depth--

  // 是对象，则循环遍历每个键
  for (const key in value) {
    traverse(value[key], depth, seen)
  }

  return value
}
