// import { createPortal } from 'react-dom'
import Portal from './Portal'
import { useEffect, useRef } from 'react'

function App() {
  // const content = (
  //   <div className='btn'>
  //     <button>按钮</button>
  //   </div>
  // )

  // // react 提供了 createPortal 的 api，可以把组件渲染到某个 dom 下。
  // // 可以把它封装成 Portal 组件来用。
  // // 接收 attach、children 参数，attach 就是挂载到的 dom 节点，默认是 document.body
  // return createPortal(content, document.body)

  const content = (
    <div className='btn'>
      <button>按钮</button>
    </div>
  )

  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    console.log(containerRef)
  }, [])

  // 使用自己封装的 Portal 组件
  return (
    <Portal attach={document.body} ref={containerRef}>
      {content}
    </Portal>
  )
}

export default App
