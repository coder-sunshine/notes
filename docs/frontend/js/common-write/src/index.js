/**
 * @description 防抖
 * @param {Function} fn 防抖函数
 * @param {Number} delay 延迟时间
 */
function debounce(fn, delay) {
  let timer = null

  // 返回一个函数,要绑定 this，返回普通函数
  return function (...args) {
    // 每次执行函数前都要清除上一次的定时器
    clearTimeout(timer)
    // 需要使用箭头函数处理 this
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * @description 节流
 * @param {Function} fn 节流函数
 * @param {Number} delay 延迟时间
 */
function throttle(fn, delay) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

// 原函数：需要3个参数
function add(a, b, c) {
  return a + b + c
}

function curry(fn) {
  // 条件1：如果收集的参数数量等于原函数需要的参数数量
  const judge = (...args) => {
    if (args.length === fn.length) {
      return fn(...args)
    } else {
      // 条件2：参数不足，返回新函数继续收集
      return (...newArgs) => judge(...args, ...newArgs) // 合并已有参数和新参数
    }
  }

  // 返回柯里化后的函数
  return judge
}

const addCurry = curry(add)
console.log(addCurry(1, 2, 3))
console.log(addCurry(1, 2)(3))
console.log(addCurry(1)(2)(3))
