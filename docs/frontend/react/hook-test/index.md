## useState

什么是 state 呢？像 111、'xxx'、{ a: 1 } 这种叫做数据，它们可以是各种数据类型，但都是固定不变的。从一种数据变成另一种数据，这种就是状态（state）了。也就是说，**状态是变化的数据。（组件的核心就是状态）**

```tsx
import { useState } from 'react'

function App() {
  const [num, setNum] = useState(1)

  return <div onClick={() => setNum(num + 1)}>{num}</div>
}

export default App
```

state 初始值为 1，点击按钮后，state 的值加 1。很简单如果初始值需要经过一系列计算得到，可以传个函数来计算初始值，但是只支持同步处理，不支持异步

```tsx
import { useState } from 'react'

function App() {
  const [num, setNum] = useState(() => {
    const num1 = 1 + 2
    const num2 = 2 + 3
    return num1 + num2
  })

  return <div onClick={() => setNum(num + 1)}>{num}</div>
}

export default App
```

![20241009094843](https://tuchuang.coder-sunshine.top/images/20241009094843.png)

useState 返回一个数组，包含 state 和 setXxx 的 api，一般都是用解构语法取。

这个 setXxx 的 api 也有两种参数：

![20241009095211](https://tuchuang.coder-sunshine.top/images/20241009095211.png)

可以直接传新的值，或者传一个函数，返回新的值，这个函数的参数是上一次的 state。

## useEffect

用来处理副作用的 hook

```tsx
import { useEffect, useState } from 'react'

async function queryData() {
  const data = await new Promise<number>(resolve => {
    setTimeout(() => {
      resolve(666)
    }, 2000)
  })
  return data
}

function App() {
  const [num, setNum] = useState(0)

  useEffect(() => {
    queryData().then(data => {
      setNum(data)
    })
  }, [])

  return <div onClick={() => setNum(prevNum => prevNum + 1)}>{num}</div>
}

export default App
```

浏览器测试可以发现 2S 后，state 变成了 666

**注意：如果要用 async await 语法，需要单独写一个函数，因为 useEffect 参数的那个函数不支持 async**

![20241009103128](https://tuchuang.coder-sunshine.top/images/20241009103128.png)

回过头看下 useEffect 的第二个参数

![20241009103225](https://tuchuang.coder-sunshine.top/images/20241009103225.png)

第二个参数这里传了一个空数组，这个数组叫做依赖项数组，react 根据它有没有变化来决定是否执行 effect 函数，传空数组就只执行一次

添加一个打印 xxxx 测试下

![20241009103627](https://tuchuang.coder-sunshine.top/images/20241009103627.png)

![20241009103700](https://tuchuang.coder-sunshine.top/images/20241009103700.png)

可以看到只打印了一次，然后修改一下依赖数组

![20241009103822](https://tuchuang.coder-sunshine.top/images/20241009103822.png)

也只会执行一次，加个变化的值进去

![20241009110419](https://tuchuang.coder-sunshine.top/images/20241009110419.png)

![20241009110433](https://tuchuang.coder-sunshine.top/images/20241009110433.png)

如果 useEffect 里跑了一个定时器，依赖变了之后，再次执行 useEffect，又跑了一个，怎么清理上一个定时器呢？

这样写：

![20241009111139](https://tuchuang.coder-sunshine.top/images/20241009111139.png)

![20241009111229](https://tuchuang.coder-sunshine.top/images/20241009111229.png)

![20241009111242](https://tuchuang.coder-sunshine.top/images/20241009111242.png)

可以看到，当 deps 数组变了，重新执行 effect 之前，会先执行清理函数，打印了 clean up。

此外，组件销毁时也会调用 cleanup 函数来进行清理。

## useLayoutEffect

和 useEffect 类似，绝大多数情况下，可以把 useEffect 换成 useLayoutEffect 也一样：

![20241009111726](https://tuchuang.coder-sunshine.top/images/20241009111726.png)

那为啥还要这两个 hook 呢？

我们知道，js 执行和渲染是阻塞的：

![20241009112149](https://tuchuang.coder-sunshine.top/images/20241009112149.png)

useEffect 的 effect 函数会在操作 dom 之后异步执行

![20241009112443](https://tuchuang.coder-sunshine.top/images/20241009112443.png)

异步执行就是用 setTimeout、Promise.then 等 api 包裹执行的逻辑。

这些逻辑会以单独的宏任务或者微任务的形式存在，然后进入 Event Loop 调度执行。

所以异步执行的 effect 逻辑就有两种可能：

![20241009112536](https://tuchuang.coder-sunshine.top/images/20241009112536.png)

![20241009112543](https://tuchuang.coder-sunshine.top/images/20241009112543.png)

灰色的部分是单独的任务。

有可能在下次渲染之前，就能执行完这个 effect。

也有可能下次渲染前，没时间执行这个 effect，所以就在渲染之后执行了。

这样就导致有的时候页面会出现闪动，因为第一次渲染的时候的 state 是之前的值，渲染完之后执行 effect 改了 state，再次渲染就是新的值了。

一般这样也没啥问题，但如果你遇到这种情况，不想闪动那一下，就用 useLayoutEffect。

它和 useEffect 的区别是它的 effect 执行是同步的，也就是在同一个任务里：

![20241009112605](https://tuchuang.coder-sunshine.top/images/20241009112605.png)

这样浏览器会等 effect 逻辑执行完再渲染。

好处自然就是不会闪动了。

但坏处也很明显，如果你的 effect 逻辑要执行很久呢？

不就阻塞渲染了？

超过 50ms 的任务就被称作长任务，会阻塞渲染，导致掉帧：

所以说，一般情况下，还是让 effect 逻辑异步执行的好。

也就是说，绝大多数情况下，用 useEffect，它能避免因为 effect 逻辑执行时间长导致页面卡顿（掉帧）。 但如果你遇到闪动的问题比较严重，那可以用 useLayoutEffect，但要注意 effect 逻辑不要执行时间太长。

同步、异步执行 effect 都各有各的问题和好处，所以 React 暴露了 useEffect 和 useLayoutEffect 这两个 hook 出来，让开发者自己决定。

## useReducer

前面用的 setState 都是直接修改值，那如果在修改值之前需要执行一些固定的逻辑呢？

这时候就要用 useReducer 了：

```tsx
import { Reducer, useReducer } from 'react'

interface Data {
  result: number
}

interface Action {
  type: 'add' | 'minus'
  num: number
}
function reducer(state: Data, action: Action) {
  switch (action.type) {
    case 'add':
      return {
        result: state.result + action.num
      }
    case 'minus':
      return {
        result: state.result - action.num
      }
  }
  return state
}

function App() {
  // useReducer 的类型参数传入 Reducer<数据的类型，action 的类型>
  // 第一个参数是 reducer，第二个参数是初始数据。
  const [res, dispatch] = useReducer<Reducer<Data, Action>>(reducer, { result: 0 })

  return (
    <div>
      <div onClick={() => dispatch({ type: 'add', num: 2 })}>加</div>
      <div onClick={() => dispatch({ type: 'minus', num: 1 })}>减</div>
      <div>{res.result}</div>
    </div>
  )
}

export default App
```

然后点击加减分别触发对应的 action，reducer 根据 action 的 type 进行操作，修改 state，然后重新渲染。

其实这个例子不复杂，没必要用 useReducer。但是如果要执行比较复杂的逻辑呢？

用 useState 需要在每个地方都写一遍这个逻辑，而用 useReducer 则是把它封装到 reducer 里，通过 action 触发就好了。

**当修改 state 的逻辑比较复杂，用 useReducer。**

回过头来继续看 useReducer：

```tsx
const [res, dispatch] = useReducer<Reducer<Data, Action>, string>(reducer, 'zero', param => {
  return {
    result: param === 'zero' ? 0 : 1
  }
})
```

它还有另一种重载，通过函数来创建初始数据，这时候 useReducer 第二个参数就是传给这个函数的参数。

并且在类型参数里也需要传入它的类型。
