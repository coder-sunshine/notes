import { useEffect, useRef, useState } from 'react'
import { useMountedState, useLifecycles, useCookie, useHover, useScrolling } from 'react-use'
// import useHover from './hooks/useHover'

const App = () => {
  // const isMounted = useMountedState()
  // const [, setNum] = useState(0)

  // useEffect(() => {
  //   setTimeout(() => {
  //     setNum(1)
  //   }, 1000)
  // }, [])

  // return <div>{isMounted() ? 'mounted' : 'pending'}</div>

  // useLifecycles(
  //   () => console.log('MOUNTED'),
  //   () => console.log('UNMOUNTED')
  // )

  // return null

  // const [value, updateCookie, deleteCookie] = useCookie('test')

  // useEffect(() => {
  //   deleteCookie()
  // }, [])

  // const updateCookieHandler = () => {
  //   updateCookie('666')
  // }

  // return (
  //   <div>
  //     <p>cookie 值: {value}</p>
  //     <button onClick={updateCookieHandler}>更新 Cookie</button>
  //     <br />
  //     <button onClick={deleteCookie}>删除 Cookie</button>
  //   </div>
  // )

  // const element = (hovered: boolean) => <div onMouseEnter={() => console.log('enter')}>Hover me! {hovered && 'Thanks'}</div>

  // const [hoverable, hovered] = useHover(element)

  // return (
  //   <div>
  //     {hoverable}
  //     <div>{hovered ? 'HOVERED' : ''}</div>
  //   </div>
  // )

  const scrollRef = useRef<HTMLDivElement>(null)
  const scrolling = useScrolling(scrollRef)

  return (
    <>
      {<div>{scrolling ? '滚动中..' : '没有滚动'}</div>}

      <div ref={scrollRef} style={{ height: '200px', overflow: 'auto' }}>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
        <div>test</div>
      </div>
    </>
  )
}

export default App
