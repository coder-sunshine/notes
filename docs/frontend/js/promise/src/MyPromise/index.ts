const promiseState = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
} as const

type PromiseState = (typeof promiseState)[keyof typeof promiseState]

export default class MyPromise<T = unknown> {
  private state: PromiseState = promiseState.PENDING
  private result: T | undefined = undefined

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
  }
}
