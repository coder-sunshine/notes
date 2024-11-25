import { useEffect, useRef } from 'react'

function App() {
  const ref = useRef<HTMLDivElement>(null)

  function getTotalOffsetTop(element: HTMLElement) {
    let totalOffsetTop = 0
    while (element) {
      if (totalOffsetTop > 0) {
        totalOffsetTop += element.clientTop // 加上上边框的高度
      }
      totalOffsetTop += element.offsetTop
      // offsetTop 相对于哪个元素，那个元素就是 offsetParent。
      element = element.offsetParent as HTMLElement
    }
    return totalOffsetTop
  }

  useEffect(() => {
    // offsetTop 相对于哪个元素，那个元素就是 offsetParent。
    console.log('offsetTop', ref.current?.offsetTop) // offsetTop 是距离最近的有 position 属性（relative 或 absolute 或 fixed）的元素的距离。
    console.log('clientTop', ref.current?.clientTop) // clientTop 也就是上边框的高度 20px。

    console.log('total offsetTop', getTotalOffsetTop(ref.current!)) // 300，少了 border的 1px,
    // 因为 offsetTop 元素顶部到 offsetParent 内容部分的距离，不包括 border。
    // 这时候加上 clientTop 就可以了，它就是上边框的高度。
  }, [])

  return (
    <div>
      <div
        style={{
          position: 'relative', // 注释掉就是 301px 了，这时候就是相对于文档顶部，所以是 200px padding+ 1px border + 100px margin。
          margin: '100px',
          padding: '200px',
          border: '1px solid blue'
        }}
      >
        <div
          id='box'
          ref={ref}
          style={{
            border: '20px solid #000',
            width: '100px',
            height: '100px',
            background: 'pink'
          }}
        ></div>
      </div>
    </div>
  )
}

export default App
