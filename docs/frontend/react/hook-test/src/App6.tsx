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
