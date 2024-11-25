import { MouseEventHandler, useEffect, useRef } from 'react'

function App() {
  const ref = useRef<HTMLDivElement>(null)

  const clickHandler: MouseEventHandler<HTMLDivElement> = e => {
    console.log('clientHeight', ref.current?.clientHeight) // clientHeight 是内容区域的高度，不包括 border。
    console.log('scrollHeight', ref.current?.scrollHeight) // scrollHeight 是滚动区域的总高度，不包括 border。
    console.log('offsetHeight', ref.current?.offsetHeight) // offsetHeight 包括 border。
    console.log('client rect height', ref.current?.getBoundingClientRect().height) // getBoundingClientRect 拿到的包围盒的高度，而 offsetHeight 是元素本来的高度。
  }

  useEffect(() => {
    window.addEventListener('scroll', () => {
      // getBoundingClientRect 拿到的包围盒的高度，而 offsetHeight 是元素本来的高度。

      // 所以，对于滚动到页面底部的判断，就可以用 window.scrollY + window.innerHeight 和 document.documentElement.scrollHeight 对比。
      console.log(window.scrollY + window.innerHeight, document.documentElement.scrollHeight)
    })
  }, [])

  return (
    <div>
      <div
        id='box'
        ref={ref}
        style={{
          border: '10px solid #000',
          marginTop: '800px',
          width: '100px',
          height: '100px',
          background: 'pink',
          overflow: 'auto'
          // transform: 'rotate(45deg)',
        }}
        onClick={clickHandler}
      >
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
        <p>xxxxx</p>
      </div>
    </div>
  )
}

export default App
