import React, { CSSProperties, useEffect, useState } from 'react'
import { getMaskStyle } from './getMaskStyle'
import './index.scss'

interface MaskProps {
  element: HTMLElement // 目标元素

  container?: HTMLElement // 遮罩层所在的容器。

  renderMaskContent?: (wrapper: React.ReactNode) => React.ReactNode

  onAnimationStart?: () => void

  onAnimationEnd?: () => void
}

export const Mask: React.FC<MaskProps> = props => {
  const { element, renderMaskContent, container, onAnimationStart, onAnimationEnd } = props

  useEffect(() => {
    onAnimationStart?.()
    const timer = setTimeout(() => {
      onAnimationEnd?.()
    }, 200)

    return () => {
      clearTimeout(timer)
    }
  }, [element])

  const [style, setStyle] = useState<CSSProperties>({})

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const style = getMaskStyle(element, container || document.documentElement)

      setStyle(style)
    })

    observer.observe(container || document.documentElement)
  }, [])

  useEffect(() => {
    if (!element) {
      return
    }

    element.scrollIntoView({
      block: 'center',
      inline: 'center'
    })

    const style = getMaskStyle(element, container || document.documentElement)

    setStyle(style)
  }, [element, container])

  const getContent = () => {
    if (!renderMaskContent) {
      return null
    }
    return renderMaskContent(<div className={'mask-content'} style={{ width: '100%', height: '100%' }} />)
  }

  return (
    <div style={style} className='mask'>
      {getContent()}
    </div>
  )
}
