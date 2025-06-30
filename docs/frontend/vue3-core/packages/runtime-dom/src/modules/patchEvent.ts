function createInvoker(fn) {
  const invoker = e => {
    invoker.value(e)
  }
  invoker.value = fn
  // 返回 invoker 函数，这个函数内部调用 fn 函数
  return invoker
}

const veiKey = Symbol('_vei')

/**
 * const fn1 = () => { console.log('更新之前的') }
 * const fn2 = () => { console.log('更新之后的') }
 * click el.addEventListener('click', (e) => { fn2(e) })
 */
export function patchEvent(el, rawName, nextValue) {
  const name = rawName.slice(2).toLowerCase()
  // 有就获取，没有就是 空对象
  const invokers = (el[veiKey] ??= {})

  const existingInvoker = invokers[rawName]

  if (nextValue) {
    // 如果之前有,则更新 invoker.value
    if (existingInvoker) {
      // 如果之前绑定了，那就更新 invoker.value 完成事件换绑
      existingInvoker.value = nextValue
      return
    }

    // 创建 invoker 函数
    const invoker = createInvoker(nextValue)

    // 将 invoker 保存到 el 上
    invokers[rawName] = invoker

    // 将 invoker 绑定到 el 上
    el.addEventListener(name, invoker)
  } else {
    /**
     * 如果新的事件没有，老的有，就移除事件
     */
    if (existingInvoker) {
      el.removeEventListener(name, existingInvoker)
    }
  }
}
