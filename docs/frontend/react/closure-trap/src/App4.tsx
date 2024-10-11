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
