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

function isPromise(value: any) {
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

          if (isPromise(res)) {
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
    console.log(onRejected)

    return this.then(null, onRejected)
  }
}
