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
  // 然后第一个参数是 reducer，第二个参数是初始数据。
  // const [res, dispatch] = useReducer<Reducer<Data, Action>>(reducer, { result: 0 })

  const [res, dispatch] = useReducer<Reducer<Data, Action>, string>(reducer, 'zero', param => {
    return {
      result: param === 'zero' ? 0 : 1
    }
  })

  return (
    <div>
      <div onClick={() => dispatch({ type: 'add', num: 2 })}>加</div>
      <div onClick={() => dispatch({ type: 'minus', num: 1 })}>减</div>
      <div>{res.result}</div>
    </div>
  )
}

export default App
