// import { useSpringValue, animated, useSpring, useSprings, useTrail, useSpringRef, useChain } from '@react-spring/web'
// import { useEffect } from 'react'
// import './App.css'

import Face from './Face'

export default function App() {
  // const width = useSpringValue(0, {
  //   config: {
  //     // duration: 2000
  //     mass: 2, // 质量（也就是重量），质量越大，回弹惯性越大，回弹的距离和次数越多
  //     friction: 10, // 张力，弹簧松紧程度，弹簧越紧，回弹速度越快
  //     tension: 200 // 摩擦力，增加点阻力可以抵消质量和张力的效果
  //   }
  // })

  // useEffect(() => {
  //   width.start(300)
  // }, [])

  // return <animated.div className='box' style={{ width }}></animated.div>

  // const styles = useSpring({
  //   from: {
  //     width: 0,
  //     height: 0
  //   },
  //   to: {
  //     width: 200,
  //     height: 200
  //   },
  //   config: {
  //     // duration: 2000
  //     mass: 2, // 质量（也就是重量），质量越大，回弹惯性越大，回弹的距离和次数越多
  //     friction: 10, // 张力，弹簧松紧程度，弹簧越紧，回弹速度越快
  //     tension: 200 // 摩擦力，增加点阻力可以抵消质量和张力的效果
  //   }
  // })

  // return <animated.div className='box' style={{ ...styles }}></animated.div>

  // const [styles, api] = useSpring(() => {
  //   return {
  //     from: {
  //       width: 100,
  //       height: 100
  //     },
  //     config: {
  //       // duration: 2000
  //       mass: 2,
  //       friction: 10,
  //       tension: 400
  //     }
  //   }
  // })

  // function clickHandler() {
  //   api.start({
  //     width: 200,
  //     height: 200
  //   })
  // }

  // return <animated.div className='box' style={{ ...styles }} onClick={clickHandler}></animated.div>

  // const [springs, api] = useSprings(3, () => ({
  //   from: { width: 0 },
  //   to: { width: 300 },
  //   config: {
  //     duration: 1000
  //   }
  // }))

  // return (
  //   <div>
  //     {springs.map(styles => (
  //       <animated.div style={styles} className='box'></animated.div>
  //     ))}
  //   </div>
  // )

  // const [springs, api] = useSprings(3, () => ({
  //   from: { width: 0 },
  //   config: {
  //     duration: 1000
  //   }
  // }))

  // useEffect(() => {
  //   api.start({ width: 300 })
  // }, [])

  // return (
  //   <div>
  //     {springs.map(styles => (
  //       <animated.div style={styles} className='box'></animated.div>
  //     ))}
  //   </div>
  // )

  // const [springs, api] = useTrail(3, () => ({
  //   from: { width: 0 },
  //   config: {
  //     duration: 1000
  //   }
  // }))

  // useEffect(() => {
  //   api.start({ width: 300 })
  // }, [])

  // return (
  //   <div>
  //     {springs.map((styles, index) => (
  //       <animated.div key={index} style={styles} className='box'></animated.div>
  //     ))}
  //   </div>
  // )

  // const api1 = useSpringRef()

  // const [springs] = useTrail(
  //   3,
  //   () => ({
  //     ref: api1,
  //     from: { width: 0 },
  //     to: { width: 300 },
  //     config: {
  //       duration: 1000
  //     }
  //   }),
  //   []
  // )

  // const api2 = useSpringRef()

  // const [springs2] = useSprings(
  //   3,
  //   () => ({
  //     ref: api2,
  //     from: { height: 100 },
  //     to: { height: 50 },
  //     config: {
  //       duration: 1000
  //     }
  //   }),
  //   []
  // )

  // useChain([api1, api2], [0, 1], 3000)

  // return (
  //   <div>
  //     {springs.map((styles1, index) => (
  //       <animated.div style={{ ...styles1, ...springs2[index] }} className='box'></animated.div>
  //     ))}
  //   </div>
  // )

  return <Face />
}
