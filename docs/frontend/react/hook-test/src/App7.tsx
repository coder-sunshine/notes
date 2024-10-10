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
