# Promise

## promise基础代码实现

```ts
const promiseState = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
} as const

type PromiseState = (typeof promiseState)[keyof typeof promiseState]

function runMicrotask(callback: () => void) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback)
  } else if (typeof process === 'object' && typeof process.nextTick === 'function') {
    // node 环境
    process.nextTick(callback)
  } else if (typeof MutationObserver === 'function') {
    const text = document.createTextNode('')
    const observer = new MutationObserver(callback)
    observer.observe(text, { characterData: true })
    text.data = '1'
  } else {
    setTimeout(callback)
  }
}

function isPromiseLike(value: any) {
  return typeof value?.then === 'function'
}

export default class MyPromise<T = unknown> {
  private state: PromiseState = promiseState.PENDING
  private result: T | undefined = undefined

  private handlers: (() => void)[] = []

  constructor(executor: (resolve: (value: T) => void, reject: (reason: any) => void) => void) {
    try {
      executor(this.resolve.bind(this), this.reject.bind(this))
    } catch (error) {
      // 如果执行器中抛出错误，则将状态设置为 rejected, 并设置错误信息
      this.reject(error)
    }
  }

  private resolve(value: T) {
    this.setState(promiseState.FULFILLED, value)
  }

  private reject(reason: any) {
    this.setState(promiseState.REJECTED, reason)
  }

  private setState(state: PromiseState, result: T | undefined) {
    // 当状态为 pending 时，才进行状态的改变
    if (this.state !== promiseState.PENDING) return
    this.result = result
    this.state = state

    this.runTasks()
  }

  private runTasks() {
    runMicrotask(() => {
      if (this.state !== promiseState.PENDING) {
        this.handlers.forEach(cb => cb())
        this.handlers = []
      }
    })
  }

  then(
    onFulfilled?: ((value: T | undefined) => void) | null | undefined,
    onRejected?: ((reason: any) => void) | null | undefined
  ) {
    // 支持链式调用，但是这里不能返回 this,因为 this是之前的 实例，状态已经被定下来了，不能再改变了。
    // 在链式调用里面是可以处理新的 promise状态的。所以需要返回一个全新的 promise 实例
    return new MyPromise((resolve, reject) => {
      // pending 状态，需要将 onFulfilled 和 onRejected 函数保存起来，等到状态改变时，再执行

      this.handlers.push(() => {
        try {
          const cb = this.state === promiseState.FULFILLED ? onFulfilled : onRejected
          const res = typeof cb === 'function' ? cb?.(this.result) : this.result

          if (isPromiseLike(res)) {
            ;(res as any).then(resolve, reject)
          } else {
            this.state === promiseState.FULFILLED ? resolve(res) : reject(res)
          }
        } catch (error) {
          reject(error)
        }
      })

      this.runTasks()
    })
  }

  catch(onRejected?: ((reason: any) => void) | null | undefined) {
    return this.then(null, onRejected)
  }

  finally(onFinally?: (() => void) | null | undefined) {
    // finally 不接受参数，把参数返回，穿透给下一个 链式调用
    return this.then(
      value => {
        onFinally?.()
        return value
      },
      error => {
        onFinally?.()
        throw error
      }
    )
  }

  /**
   * Promise.resolve() 静态方法以给定值“解决（resolve）”一个 Promise。
   * 如果该值本身就是一个 Promise，那么该 Promise 将被返回；
   * 如果该值是一个 thenable 对象，Promise.resolve() 将调用其 then() 方法及其两个回调函数；
   * 否则，返回的 Promise 将会以该值兑现。
   */
  static resolve<T>(value: T) {
    if (value instanceof Promise) {
      return value
    }

    return new Promise((resolve, reject) => {
      if (isPromiseLike(value)) {
        ;(value as any).then(resolve, reject)
      } else {
        resolve(value)
      }
    })
  }

  /**
   * Promise.reject() 静态方法返回一个以给定原因拒绝的 Promise。
   */
  static reject(reason: any) {
    return new Promise((_, reject) => {
      reject(reason)
    })
  }

  static try(fn: (...args: any[]) => any, ...args: any[]) {
    return new Promise(resolve => {
      // 这里执行如果报错的话，会自动将错误信息 reject 出去，参考 constructor 中 executor 的执行
      resolve(fn(...args))
    })
  }

  static all<T extends readonly unknown[] | []>(value: T) {
    // 将 value 转化为数组
    const promises = [...value]
    // 返回 promise
    return new MyPromise((resolve, reject) => {
      // 声明一个数组，用来保存resolve 的结果
      const results: T[] = []

      // 数组长度为0 直接返回空数组
      if (promises.length === 0) {
        resolve([])
      }

      // 声明一个计数器，用来记录 执行的 promise 成功的 数量
      let count = 0

      // 遍历数组，执行每一个
      promises.forEach((promise, index) => {
        console.log(index)

        // 将所有 promise 转为 Promise ，因为有可能 传递的 value 是 [1,2,promise] 这种
        MyPromise.resolve(promise).then(res => {
          // 将结果保存起来，如果全部成功，则 resolve 出去
          results[index] = res
          count++

          if (count === promises.length) {
            resolve(results)
          }

          // 失败的话直接执行 reject 就行了
        }, reject)
      })
    })
  }
}
```
