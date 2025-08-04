# 常见函数手写

## 普通函数手写

### 防抖

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

### 节流

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

### 柯里化

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

## 场景

### 请求竞态问题

假如我们页面上有两个按钮，这两个按钮是调用同一个函数发送请求，但是他们的参数是不一样的，最终页面上只能展示一个请求的结果，如果我们不对它进行限制，那么就会导致请求竞态问题，假设我们点击按钮1，在按钮1发送的请求没回来的时候，我们又点击按钮2，那么我们很难保证按钮2的请求一定会比按钮1的请求先回来，所以是有可能导致按钮2先回来，那么按钮1的请求结果就会覆盖按钮 2的请求结果，这样就会导致页面上的结果是错误的，所以我们就需要解决这个问题。

```js
const getData = id => {
  const time = id === 1 ? 2000 : 1000
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(id)
    }, time)
  })
}

getData(1).then(res => {
  console.log(res)
})

getData(2).then(res => {
  console.log(res)
})
```

![20250801154618](https://tuchuang.coder-sunshine.top/images/20250801154618.png)

上面这个两次 `getData` 调用来模拟，我们希望的是最后结果是2，但是由于请求响应的时间是随机的，所以就有可能导致结果是1，这就导致了请求竞态问题。

其实只需要把第一次的 then 取消执行就行了，也就是只执行最后一次的 then 函数。

```js
function createCancelTask(asyncTask) {
  return (...args) => {
    asyncTask(...args)
  }
}

const getData = id => {
  const time = id === 1 ? 2000 : 1000
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(id)
    }, time)
  })
}

const getDataTask = createCancelTask(getData)

getDataTask(1).then(res => {
  console.log(res)
})

getDataTask(2).then(res => {
  console.log(res)
})
```

```js
function createCancelTask(asyncTask) {
  return (...args) => {
    // 这里需要返回一个 promise，虽然原函数是promise，
    // 但是不好控制。手动返回一个 promise，做状态穿透就行了
    return new Promise((resolve, reject) => {
      asyncTask(...args).then(
        res => resolve(res),
        err => reject(err)
      )
    })
  }
}
```

既然这里手动返回的 `promise` 成功或者失败会走到 `asyncTask(...args).then(resolve, reject)` `then` 方法里面，那么只需要把上一次的 resolve 和 reject 置空就行了。也就是执行空函数，就没有影响了。

```js
function createCancelTask(asyncTask) {
  return (...args) => {
    // 这里需要返回一个 promise，虽然原函数是promise，
    // 但是不好控制。手动返回一个 promise，做状态穿透就行了
    return new Promise((resolve, reject) => {
      resolve = reject = () => {}
      asyncTask(...args).then(
        res => resolve(res),
        err => reject(err)
      )
    })
  }
}
```

这样写执行就不会有输出结果了。然后只需要把 `resolve = reject = () => {}` 保存起来，后面每次调用的时候，都把上一次的 `resolve` 和 `reject` 置空就行了。这样当 `promise` 完成后，执行空函数。

```js
function createCancelTask(asyncTask) {
  // 定义一个空函数
  let cancel = () => {}

  return (...args) => {
    // 这里需要返回一个 promise，虽然原函数是promise，
    // 但是不好控制。手动返回一个 promise，做状态穿透就行了
    return new Promise((resolve, reject) => {
      // 将空函数赋值
      cancel = () => {
        resolve = reject = () => {}
      }

      asyncTask(...args).then(
        res => resolve(res),
        err => reject(err)
      )
    })
  }
}
```

但是有个问题，这个 cancel 函数 什么时候调用呢，其实就是下一次执行的时候就调用，

```js
function createCancelTask(asyncTask) {
  // 定义一个空函数
  let cancel = () => {}

  return (...args) => {
    // 这里需要返回一个 promise，虽然原函数是promise，
    // 但是不好控制。手动返回一个 promise，做状态穿透就行了
    return new Promise((resolve, reject) => {
      // 下一次执行的时候就调用,(第一次调用是空函数，无所谓)
      cancel() //[!code ++]

      // 将空函数赋值
      cancel = () => {
        resolve = reject = () => {}
      }

      asyncTask(...args).then(
        res => resolve(res),
        err => reject(err)
      )
    })
  }
}
```

```js
// 最终版

const NOOP = () => {}

function createCancelTask(asyncTask) {
  // 定义一个空函数
  let cancel = NOOP

  return (...args) => {
    // 这里需要返回一个 promise，虽然原函数是promise，
    // 但是不好控制。手动返回一个 promise，做状态穿透就行了
    return new Promise((resolve, reject) => {
      // 下一次执行的时候就调用，(第一次调用是空函数，无所谓)
      cancel()

      // 将空函数赋值
      cancel = () => {
        resolve = reject = NOOP
      }

      asyncTask(...args).then(
        res => resolve(res),
        err => reject(err)
      )
    })
  }
}
```

![20250801161402](https://tuchuang.coder-sunshine.top/images/20250801161402.png)

这样的话就只有第二次的请求结果了，也就解决了请求竞态的问题。 **也就是修改了运行时的函数体**

### 异步相关问题

#### 异步函数延迟执行工具

有的时候需要将异步函数延迟执行，但是又不能修改原函数的代码，这个时候就可以使用这个工具函数了，实现也很简单，只需要返回一个 promise,然后将原函数的状态通过 promise 穿透就行了。

```js
function delayAsync(fn, delay) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await fn.apply(this, args)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }
}
```

使用示例：

```js
// 使用示例
const asyncFn = async name => {
  return `Hello, ${name}!`
  // return Promise.reject('error')
}

const delayedAsyncFn = delayAsync(asyncFn, 2000)

delayedAsyncFn('World')
  .then(result => {
    console.log(result) // 2秒后输出: Hello, World!
  })
  .catch(error => {
    console.log('error', error)
  })
```
