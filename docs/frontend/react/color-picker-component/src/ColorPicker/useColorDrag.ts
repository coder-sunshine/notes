import { useEffect, useRef, useState } from 'react'
import { TransformOffset } from './Transform'
import { Color } from './color'

type EventType = MouseEvent | React.MouseEvent<Element, MouseEvent>

type EventHandle = (e: EventType) => void

interface useColorDragProps {
  offset?: TransformOffset
  color?: Color
  containerRef: React.RefObject<HTMLDivElement>
  targetRef: React.RefObject<HTMLDivElement>
  direction?: 'x' | 'y'
  onDragChange?: (offset: TransformOffset) => void
  calculate?: () => TransformOffset
}

function useColorDrag(props: useColorDragProps): [TransformOffset, EventHandle] {
  const { offset, color, targetRef, containerRef, direction, onDragChange, calculate } = props

  const [offsetValue, setOffsetValue] = useState(offset || { x: 0, y: 0 })
  const dragRef = useRef({
    flag: false
  })

  useEffect(() => {
    if (dragRef.current.flag === false) {
      const calcOffset = calculate?.()
      if (calcOffset) {
        setOffsetValue(calcOffset)
      }
    }
  }, [color])

  // 先把之前的事件监听器去掉：
  useEffect(() => {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragStop)
  }, [])

  const updateOffset: EventHandle = e => {
    const scrollXOffset = document.documentElement.scrollLeft || document.body.scrollLeft
    const scrollYOffset = document.documentElement.scrollTop || document.body.scrollTop

    // e.pageX 和 e.pageY 是距离页面顶部和左边的距离。
    // 减去 scrollLeft 和 scrollTop 之后就是离可视区域顶部和左边的距离了。
    const pageX = e.pageX - scrollXOffset
    const pageY = e.pageY - scrollYOffset

    const { x: rectX, y: rectY, width, height } = containerRef.current!.getBoundingClientRect()

    const { width: targetWidth, height: targetHeight } = targetRef.current!.getBoundingClientRect()

    // 圆的半径
    const centerOffsetX = targetWidth / 2
    const centerOffsetY = targetHeight / 2

    // 但是拖动不能超出 container 的区域，所以用 Math.max 来限制在 0 到 width、height 之间拖动。
    const offsetX = Math.max(0, Math.min(pageX - rectX, width)) - centerOffsetX
    const offsetY = Math.max(0, Math.min(pageY - rectY, height)) - centerOffsetY

    // 这里如果传入的 direction 参数是 x，那么就只能横向拖动，是为了下面的 Slider 准备的：
    const calcOffset = {
      x: offsetX,
      y: direction === 'x' ? offsetValue.y : offsetY
    }

    setOffsetValue(calcOffset)
    onDragChange?.(calcOffset)
  }

  // mouseup 的时候去掉事件监听器。
  const onDragStop: EventHandle = e => {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragStop)
    // 这个过程中修改记录拖动状态的 flag 的值。
    dragRef.current.flag = false
  }

  // mousemove 的时候根据 event 修改 offset。
  const onDragMove: EventHandle = e => {
    e.preventDefault()
    updateOffset(e)
  }

  // 在 mousedown 的时候绑定 mousemove 和 mouseup 事件：
  const onDragStart: EventHandle = e => {
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragStop)

    dragRef.current.flag = true
  }

  return [offsetValue, onDragStart]
}

export default useColorDrag
