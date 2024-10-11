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
