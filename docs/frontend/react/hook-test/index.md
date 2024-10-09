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