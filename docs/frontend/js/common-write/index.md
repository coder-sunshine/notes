# 常见函数手写

## 防抖

> [!TIP] 防抖函数
>
> 1. 高频触发
> 2. 耗时操作
> 3. 以最后一次执行为准 (例如回城操作，短时间内点了好几次，也只以最后一次为准)

```js
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
```

## 节流

> [!TIP] 节流函数
>
> 1. 一段时间内只能执行一次
> 2. 可以想象成放技能，技能 `CD` 的时候，不管按多少次，都没用，只有 `CD` 好了才会触发

```js
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
```

## 柯里化

> [!TIP] 柯里化
>
> 1. 参数复用
> 2. 提前返回
> 3. 延迟执行 (不一次性传入所有参数，而是分多次传入，每次传入部分参数，直到参数集齐后执行函数)
> 4. 类似 收集七颗龙珠，集齐后才能召唤神龙（执行函数）

问题：实现一个 函数，可以实现 fn(1)(2)(3) = 6

```js
// 原函数：需要3个参数
function add(a, b, c) {
  return a + b + c
}

function curry(fn) {
  // 条件1：如果收集的参数数量等于原函数需要的参数数量
  const judge = (...args) => {
    if (args.length === fn.length) {
      // 直接调用 fn
      fn(...args)
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
```

可以看到不管怎么调用结果都是 6

![20250801142000](https://tuchuang.coder-sunshine.top/images/20250801142000.png)
