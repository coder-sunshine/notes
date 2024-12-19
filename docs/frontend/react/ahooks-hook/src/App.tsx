import React, { useRef, useState } from 'react'
// import { useSize } from 'ahooks'
import { useSize } from './hooks/index'
import useHover from './hooks/useHover'
// import useWhyDidYouUpdate from './hooks/useWhyDidYouUpdate'
import { useTimeout, useWhyDidYouUpdate, useCountDown } from 'ahooks'
// import { useHover } from 'react-use'
// import { useHover } from 'ahooks'

// const Demo: React.FC<{ count: number }> = props => {
//   const [randomNum, setRandomNum] = useState(Math.random())

//   useWhyDidYouUpdate('Demo', { ...props, randomNum })

//   return (
//     <div>
//       <div>
//         <span>number: {props.count}</span>
//       </div>
//       <div>
//         randomNum: {randomNum}
//         <button onClick={() => setRandomNum(Math.random)}>设置随机 state</button>
//       </div>
//     </div>
//   )
// }

export default function App() {
  // const ref = useRef<HTMLDivElement>(null)
  // const size = useSize(ref)
  // return (
  //   <div ref={ref}>
  //     <p>改变窗口大小试试</p>
  //     <p>
  //       width: {size?.width}px, height: {size?.height}px
  //     </p>
  //   </div>
  // )
  // const element = (hovered: boolean) => <div>Hover me! {hovered && 'Thanks'}</div>
  // react-use useHover
  // const [hoverAble, hovered] = useHover(element)
  // return (
  //   <div>
  //     {hoverAble}
  //     <div>{hovered ? 'HOVERED' : ''}</div>
  //   </div>
  // )
  // ahooks useHover
  // const ref = useRef<HTMLDivElement>(null);
  // const isHovering = useHover(ref);
  // return <div ref={ref}>{isHovering ? 'hover' : 'leaveHover'}</div>;
  // const [state, setState] = useState(1)
  // useTimeout(() => {
  //   setState(state + 1)
  // }, 3000)
  // return <div>{state}</div>
  // const [count, setCount] = useState(0)
  // return (
  //   <div>
  //     <Demo count={count} />
  //     <div>
  //       <button onClick={() => setCount(prevCount => prevCount - 1)}>减一</button>
  //       <button onClick={() => setCount(prevCount => prevCount + 1)}>加一</button>
  //     </div>
  //   </div>
  // )

  const [countdown, formattedRes] = useCountDown({
    targetDate: `${new Date().getFullYear()}-12-31 23:59:59`
  })

  const { days, hours, minutes, seconds, milliseconds } = formattedRes

  return (
    <p>
      距离今年年底还剩 {days} 天 {hours} 小时 {minutes} 分钟 {seconds} 秒 {milliseconds} 毫秒
    </p>
  )
}
