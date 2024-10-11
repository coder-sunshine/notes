# Hook 的闭包陷阱的成因和解决方案

什么是闭包陷阱呢？例子如下：

```tsx
import { useEffect, useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setInterval(() => {
      console.log(count)
      setCount(count + 1)
    }, 1000)
  }, [])

  return <div>{count}</div>
}

export default App
```

![20241011164515](https://tuchuang.coder-sunshine.top/images/20241011164515.png)

可以看到这个例子中 count 并不会每秒加 1，setCount 中拿到的 count 永远都是 0。为什么呢？

因为 useEffect 的依赖数组是 []，也就是只会执行一次，引用的就一直是第一次的 count，从而形成了 闭包，实际执行是下图所示。

![20241011164836](https://tuchuang.coder-sunshine.top/images/20241011164836.png)

这就导致了每次执行定时器的时候，都是在 count = 0 的基础上加一。

这就叫做 hook 的闭包陷阱。

## 第一种解法

竟然这里是闭包引起的，那么不让它形成闭包就可以解决了。可以使用 setState 的第二种写法

![20241011165027](https://tuchuang.coder-sunshine.top/images/20241011165027.png)

这次并没有形成闭包，每次的 count 都是参数传入的上一次的 state。这样功能就正常了。

还可以用 useReducer 来解决这个问题。

因为 useReducer 是 dispatch 一个 action，不直接引用 state，所以也不会形成闭包：

```tsx
import { Reducer, useEffect, useReducer } from 'react'

interface Action {
  type: 'add' | 'minus'
  num: number
}

function reducer(state: number, action: Action) {
  switch (action.type) {
    case 'add':
      return state + action.num
    case 'minus':
      return state - action.num
  }
  return state
}

function App() {
  const [count, dispatch] = useReducer<Reducer<number, Action>>(reducer, 0)

  useEffect(() => {
    setInterval(() => {
      console.log(count)
      dispatch({ type: 'add', num: 1 })
    }, 1000)
  }, [])

  return <div>{count}</div>
}

export default App
```

![20241011165417](https://tuchuang.coder-sunshine.top/images/20241011165417.png)

思路和 setState 传入函数一样，所以算是一种解法。

## 弟二种解法

上面的方案有些缺陷，就是可以看到控制台一直打印的都是 0，也就是闭包的值，有的时候必须拿到最新的 state，但是又不能挪到 setState 里面去处理。

![20241011165801](https://tuchuang.coder-sunshine.top/images/20241011165801.png)

这种情况可以把 count 添加到 依赖数组 就行了。这样 count 变化的时候重新执行 effect，那执行的函数引用的就是最新的 count 值。

![20241011170339](https://tuchuang.coder-sunshine.top/images/20241011170339.png)

![20241011170351](https://tuchuang.coder-sunshine.top/images/20241011170351.png)

这种解法是能解决闭包陷阱的，但在这里并不合适，因为 effect 里跑的是定时器，每次都重新跑定时器，那定时器就不是每 1s 执行一次了。

## 第三种解法

有定时器不能重新跑 effect 函数，那怎么做呢？

可以用 useRef。

```tsx
import { useEffect, useState, useRef } from 'react'

function App() {
  const [count, setCount] = useState(0)

  const updateCount = () => {
    console.log('count', count)
    setCount(count + 1)
  }
  const ref = useRef(updateCount)

  ref.current = updateCount

  useEffect(() => {
    const timer = setInterval(() => ref.current(), 1000)

    return () => {
      clearInterval(timer)
    }
  }, [])

  return <div>{count}</div>
}

export default App
```

![20241011170943](https://tuchuang.coder-sunshine.top/images/20241011170943.png)

通过 useRef 创建 ref 对象，保存执行的函数，每次渲染更新 ref.current 的值为最新函数。（ref.current 的值改了不会触发重新渲染，）

这样，定时器执行的函数里就始终引用的是最新的 count。

useEffect 只跑一次，保证 setInterval 不会重置，是每秒执行一次。

执行的函数是从 ref.current 取的，这个函数每次渲染都会更新，引用着最新的 count。

因为 ref.current 的值改了不会触发重新渲染，所以很适合这种保存渲染过程中的一些数据的场景。例如定时器这种处理就是常见的一种场景，可以封装一下

```tsx
import { useEffect, useState, useRef, useLayoutEffect } from 'react'

function useInterval(fn: Function, delay?: number | null) {
  const callbackFn = useRef(fn)

  useLayoutEffect(() => {
    callbackFn.current = fn
  })

  useEffect(() => {
    const timer = setInterval(() => callbackFn.current(), delay || 0)

    return () => clearInterval(timer)
  }, [])
}

function App() {
  const [count, setCount] = useState(0)

  const updateCount = () => {
    setCount(count + 1)
  }

  useInterval(updateCount, 1000)

  return <div>{count}</div>
}

export default App
```

这里为啥要包一层 useLayoutEffect 呢？其实从结果来看都是一样的。但是文档里面不建议:

![20241011173514](https://tuchuang.coder-sunshine.top/images/20241011173514.png)

不过也没什么关系，因为 ahooks 丽就是直接在渲染过程中改了 ref.current 的值

![20241011173601](https://tuchuang.coder-sunshine.top/images/20241011173601.png)

上面的 useInterval 没有返回 clean 函数，调用者不能停止定时器，所以我们再加一个 ref 来保存 clean 函数，然后返回：

```tsx
import { useEffect, useState, useRef, useCallback } from 'react'

function useInterval(fn: Function, time: number) {
  const ref = useRef(fn)

  ref.current = fn

  const cleanUpFnRef = useRef<Function>()

  const clean = useCallback(() => {
    cleanUpFnRef.current?.()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => ref.current(), time)

    cleanUpFnRef.current = () => {
      clearInterval(timer)
    }

    return clean
  }, [])

  return clean
}

function App() {
  const [count, setCount] = useState(0)

  const updateCount = () => {
    setCount(count + 1)
  }

  useInterval(updateCount, 1000)

  return <div>{count}</div>
}

export default App
```

为什么要用 useCallback 包裹返回的函数呢？

因为这个返回的函数可能作为参数传入别的组件，这样用 useCallback 包裹就可以避免该参数的变化，配合 memo 可以起到减少没必要的渲染的效果。

## 总结

闭包陷阱就是 effect 函数等引用了 state，形成了闭包，但是并没有把 state 加到依赖数组里，导致执行 effect 时用的 state 还是之前的。

这个问题有三种解决方案：

- 使用 setState 的函数的形式，从参数拿到上次的 state，这样就不会形成闭包了，或者用 useReducer，直接 dispatch action，而不是直接操作 state，这样也不会形成闭包

- 把用到的 state 加到依赖数组里，这样 state 变了就会重新跑 effect 函数，引用新的 state

- 使用 useRef 保存每次渲染的值，用到的时候从 ref.current 取

定时器的场景需要保证定时器只跑一次，不然重新跑会导致定时不准，所以需要用 useEffect + useRef 的方式来解决闭包陷阱问题。

我们还封装了 useInterval 的自定义 hook，这样可以不用在每个组件里都写一样的 useRef + useEffect 了，直接用这个自定义 hook 就行。

此外，关于要不要在渲染函数里直接修改 ref.current，其实都可以，直接改也行，包一层 useLayoutEffect 或者 useEffect 也行。

闭包陷阱是经常会遇到的问题，要对它的成因和解决方案有清晰的认识。
