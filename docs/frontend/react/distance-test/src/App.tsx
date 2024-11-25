import { MouseEventHandler, useEffect, useRef } from 'react'
import { useMouse } from 'react-use'

function App() {
  const ref = useRef<HTMLDivElement>(null)

  const clickHandler: MouseEventHandler<HTMLDivElement> = e => {
    console.log('box pageY', e.pageY)
    console.log('box clientY', e.clientY)
    // react 事件是合成事件，所以它少了一些原生事件的属性，比如这里的 offsetY，也就是点击的位置距离触发事件的元素顶部的距离。
    console.log('box offsetY', e.offsetY)
    console.log('box screenY', e.screenY)

    // 点击的位置距离可视区域顶部的距离
    const top = document.getElementById('box')!.getBoundingClientRect().top
    console.log('box top', top)
    // console.log('box offsetY', e.pageY - top - window.pageYOffset) // 已弃用 screenY 等价于 pageYOffset
    console.log('window.screenY', window.screenY)

    console.log('box offsetY', e.pageY - top - window.screenY)
    // 也可以通过原生事件获取 offsetY
    console.log('box offsetY', e.nativeEvent.offsetY)
  }

  useEffect(() => {
    document.getElementById('box')!.addEventListener('click', e => {
      console.log('box2 pageY', e.pageY)
      console.log('box2 clientY', e.clientY)
      console.log('box2 offsetY', e.offsetY)
      console.log('box2 screenY', e.screenY)
    })
  }, [])

  return (
    <div>
      <div
        id='box'
        ref={ref}
        style={{
          marginTop: '800px',
          width: '100px',
          height: '100px',
          background: 'blue'
        }}
        onClick={clickHandler}
      ></div>
    </div>
  )
}

export default App
