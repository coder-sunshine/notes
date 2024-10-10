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

它还有另一种重载，通过函数来创建初始数据，这时候 useReducer 第二个参数就是传给这个函数的参数。

并且在类型参数里也需要传入它的类型。

```tsx
const [res, dispatch] = useReducer<Reducer<Data, Action>, string>(reducer, 'zero', param => {
  return {
    result: param === 'zero' ? 0 : 1
  }
})
```

## useReducer + immer

使用 reducer 有一个特别要注意的地方：

![20241009150004](https://tuchuang.coder-sunshine.top/images/20241009150004.png)

如果直接修改原始的 state 返回，是触发不了重新渲染的：加 不管点多少次都没用

![20241009151206](https://tuchuang.coder-sunshine.top/images/20241009151206.png)

必须返回一个新的对象才行。

但这也有个问题，如果对象结构很复杂，每次都创建一个新的对象会比较繁琐，而且性能也不好。

比如这样：

```tsx
import { Reducer, useReducer } from 'react'

interface Data {
  a: {
    c: {
      e: number
      f: number
    }
    d: number
  }
  b: number
}

interface Action {
  type: 'add'
  num: number
}

function reducer(state: Data, action: Action) {
  switch (action.type) {
    case 'add':
      return {
        ...state,
        a: {
          ...state.a,
          c: {
            ...state.a.c,
            e: state.a.c.e + action.num
          }
        }
      }
  }
  return state
}

function App() {
  const [res, dispatch] = useReducer<Reducer<Data, Action>, string>(reducer, 'zero', param => {
    return {
      a: {
        c: {
          e: 0,
          f: 0
        },
        d: 0
      },
      b: 0
    }
  })

  return (
    <div>
      <div onClick={() => dispatch({ type: 'add', num: 2 })}>加</div>
      <div>{JSON.stringify(res)}</div>
    </div>
  )
}

export default App
```

![20241009151415](https://tuchuang.coder-sunshine.top/images/20241009151415.png)

点两次加

![20241009151430](https://tuchuang.coder-sunshine.top/images/20241009151430.png)

这里的 data 是一个复杂的对象结构，需要改的是其中的一个属性，但是为了创建新对象，要把其余属性依次复制一遍。

这样能完成功能，但是写起来很麻烦，也不好维护。

有没有什么更好的方式呢？

有，复杂对象的修改就要用 immutable 相关的库了。

最常用的是 immer：

```shell
pnpm i immer
```

用法相当简单，只有一个 produce 的 api：

第一个参数是要修改的对象，第二个参数的函数里直接修改这个对象的属性，返回的结果就是一个新的对象。

![20241009151706](https://tuchuang.coder-sunshine.top/images/20241009151706.png)

功能正常。用起来超级简单。

immer 是依赖 Proxy 实现的，它会监听你在函数里对属性的修改，然后帮你创建一个新对象。

reducer 需要返回一个新的对象，才会触发渲染，其实 useState 也是。

比如这样：

```tsx
import { useState } from 'react'

function App() {
  const [obj, setObj] = useState({
    a: {
      c: {
        e: 0,
        f: 0
      },
      d: 0
    },
    b: 0
  })

  return (
    <div>
      <div
        onClick={() => {
          obj.a.c.e++
          setObj(obj)
        }}
      >
        加
      </div>
      <div>{JSON.stringify(obj)}</div>
    </div>
  )
}

export default App
```

因为对象引用没变，同样不会重新渲染：

也可以用 immer 处理：

![20241009152122](https://tuchuang.coder-sunshine.top/images/20241009152122.png)

综上，**在 react 里，只要涉及到 state 的修改，就必须返回新的对象，不管是 useState 还是 useReducer。**

如果是复杂的深层对象的修改，可以用 immer 来优化。

这也就是大家常说 React 推崇的是数据不可变原理

## useRef

useRef 通常用来保存 DOM 引用

```tsx
import { useEffect, useRef } from 'react'

function App() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  })

  return (
    <div>
      <input ref={inputRef}></input>
    </div>
  )
}

export default App
```

ref 其实就是一个有 current 属性的对象，除了可以保存 dom 引用，也可以放别的内容：

```tsx
function App() {
  const numRef = useRef<number>(0)

  return (
    <div>
      <div
        onClick={() => {
          numRef.current += 1
        }}
      >
        {numRef.current}
      </div>
    </div>
  )
}

export default App
```

![20241009153358](https://tuchuang.coder-sunshine.top/images/20241009153358.png)

此时不管怎么点击都没反应，因为它不会触发重新渲染

想触发渲染，还是得配合 state：

![20241009154254](https://tuchuang.coder-sunshine.top/images/20241009154254.png)

不过一般不这么用，如果想改变内容会触发重新渲染，直接用 useState 或者 useReducer 就可以了。

useRef 一般是用来存一些不是用于渲染的内容的。

单个组件内如何拿到 ref 我们知道了，那如果是想把 ref 从子组件传递到父组件呢？

这种有专门的 api： forwardRef。

## forwardRef + useImperativeHandle

```tsx
import { useRef } from 'react'
import { useEffect } from 'react'
import React from 'react'

const Child: React.ForwardRefRenderFunction<HTMLInputElement> = (props, ref) => {
  return (
    <div>
      <input ref={ref}></input>
    </div>
  )
}

const WrapedChild = React.forwardRef(Child)

function App() {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log('ref', ref.current)
    ref.current?.focus()
  }, [])

  return (
    <div className='App'>
      <WrapedChild ref={ref} />
    </div>
  )
}

export default App
```

使用 forwardRef 可以把 ref 传递到父组件，然后父组件就可以通过 ref.current 得到子组件传过来的 ref。

被 forwardRef 包裹的组件的类型就要用 React.forwardRefRenderFunction 了

![20241010091543](https://tuchuang.coder-sunshine.top/images/20241010091543.png)

第一个类型参数是 ref 的 content 的类型，第二个类型参数是 props 的类型。

但有的时候，我不是想把原生标签暴露出去，而是暴露一些自定义内容。

这时候就需要 useImperativeHandle 的 hook 了。

它有 3 个参数，第一个是传入的 ref，第二个是是返回新的 ref 值的函数，第三个是依赖数组。

```tsx
import React, { useRef, useEffect, useImperativeHandle } from 'react'

interface RefProps {
  aaa: () => void
}

const Child: React.ForwardRefRenderFunction<RefProps> = (props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null)

  // 有 3 个参数，第一个是传入的 ref，第二个是是返回新的 ref 值的函数，第三个是依赖数组
  useImperativeHandle(
    ref,
    () => {
      return {
        aaa() {
          inputRef.current?.focus()
        }
      }
    },
    [inputRef]
  )

  return (
    <div>
      <input ref={inputRef}></input>
    </div>
  )
}

const WrapedChild = React.forwardRef(Child)

function App() {
  const ref = useRef<RefProps>(null)

  useEffect(() => {
    console.log('ref', ref.current)
    ref.current?.aaa()
  }, [])

  return (
    <div className='App'>
      <WrapedChild ref={ref} />
    </div>
  )
}

export default App
```

其实就是用 useImperativeHandle 自定义了 ref 对象，然后父组件里拿到的 ref 就是 useImperativeHandle 第二个参数的返回值了。

![20241010092115](https://tuchuang.coder-sunshine.top/images/20241010092115.png)

效果一样

## useContext

跨任意层组件传递数据，一般用 Context。

```tsx
import { createContext, useContext } from 'react'

const countContext = createContext(111)

function Aaa() {
  return (
    <div>
      <countContext.Provider value={222}>
        <Bbb></Bbb>
      </countContext.Provider>
    </div>
  )
}

function Bbb() {
  return (
    <div>
      <Ccc></Ccc>
    </div>
  )
}

function Ccc() {
  const count = useContext(countContext)
  return <h2>context 的值为：{count}</h2>
}

export default Aaa
```

用 createContext 创建 context，在 Aaa 里面使用 xxxContext.Provider 修改它的值，然后在 Ccc 里面用 useContext 取出来。

可以看到，拿到的值是被 Provider 修改过的 222。

class 组件是通过 Consumer 来取 context 的值：

```tsx
import { createContext, Component } from 'react'

const countContext = createContext(111)

class Ccc extends Component {
  render() {
    return <h2>context 的 值为：{this.props.count}</h2>
  }
}

function Bbb() {
  return (
    <div>
      <countContext.Consumer>{count => <Ccc count={count}></Ccc>}</countContext.Consumer>
    </div>
  )
}
```

不过现在很少写 class 组件了。

总结一下就是，**用 createContext 创建 context 对象，用 Provider 修改其中的值， function 组件使用 useContext 的 hook 来取值，class 组件使用 Consumer 来取值。**

组件库里用 Context 很多，比如 antd 里就有大量 Context 的使用：

![20241010094518](https://tuchuang.coder-sunshine.top/images/20241010094518.png)

配置数据基本都是用 Context 传递。
