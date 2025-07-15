# Promise

## promise基础代码实现

```ts
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
    executor(this.resolve.bind(this), this.reject.bind(this))
  }

  resolve(value: T) {
    this.result = value
    this.state = promiseState.FULFILLED
  }

  reject(reason: any) {
    this.result = reason
    this.state = promiseState.REJECTED
  }
}
```

```ts
import MyPromise from './MyPromise'

const p1 = new MyPromise((resolve, reject) => {
  resolve(123)
})

console.log(p1)
```
