import { CSSProperties, FC, ReactNode, useEffect, useRef, useState } from 'react'

interface MyLazyloadProps {
  className?: string
  style?: CSSProperties
  placeholder?: ReactNode
  offset?: string | number
  width?: number | string
  height?: string | number
  onContentVisible?: () => void
  children: ReactNode
}

const MyLazyload: FC<MyLazyloadProps> = props => {
  const { className = '', style, offset = 0, width, onContentVisible, placeholder, height, children } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  const elementObserver = useRef<IntersectionObserver>()

  function lazyLoadHandler(entries: IntersectionObserverEntry[]) {
    console.log(entries)

    const [entry] = entries
    const { isIntersecting } = entry

    // 当 isIntersecting 为 true 的时候，就是从不相交到相交，反之，是从相交到不相交。
    if (isIntersecting) {
      // 设置 visible 为 true，回调 onContentVisible，然后去掉监听。
      setVisible(true)
      onContentVisible?.()

      const node = containerRef.current
      if (node && node instanceof HTMLElement) {
        elementObserver.current?.unobserve(node)
      }
    }
  }

  useEffect(() => {
    const options = {
      // rootMargin 就是距离多少进入可视区域就触发，和参数的 offset 一个含义。
      rootMargin: typeof offset === 'number' ? `${offset}px` : offset || '0px',
      // threshold 是元素进入可视区域多少比例的时候触发，0 就是刚进入可视区域就触发。
      threshold: 0
    }

    elementObserver.current = new IntersectionObserver(lazyLoadHandler, options)

    const node = containerRef.current

    if (node instanceof HTMLElement) {
      // 用 IntersectionObserver 监听 div。
      elementObserver.current.observe(node)
    }

    return () => {
      if (node && node instanceof HTMLElement) {
        elementObserver.current?.unobserve(node)
      }
    }
  }, [])

  const styles = { height, width, ...style }

  return (
    <div ref={containerRef} className={className} style={styles}>
      {visible ? children : placeholder}
    </div>
  )
}

export default MyLazyload
