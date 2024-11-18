import React, { useEffect, useImperativeHandle, useMemo } from 'react'
import { createPortal } from 'react-dom'

export interface PortalProps {
  attach?: HTMLElement | string // 挂载到的 dom 节点，可以是选择器字符串，也可以是 HTMLElement 对象
  children: React.ReactNode
}

// 提供一个 getAttach 方法，如果传入的是 string，就作为选择器来找到对应的 dom，如果是 HTMLElement，则直接作为挂载节点，否则，返回 document.body：
const getAttach = (attach: PortalProps['attach']) => {
  if (typeof attach === 'string') {
    return document.querySelector(attach)
  }

  if (typeof attach === 'object' && attach instanceof window.HTMLElement) {
    return attach
  }

  return document.body
}

const Portal = React.forwardRef((props: PortalProps, ref) => {
  const { attach = document.body, children } = props

  // 在 attach 的元素下添加一个 dom 节点作为容器
  const container = useMemo(() => {
    const el = document.createElement('div')
    el.className = 'portal-container'
    return el
  }, [])

  // 初始化挂载
  useEffect(() => {
    const parentElement = getAttach(attach)
    parentElement?.appendChild(container)

    return () => {
      // 卸载时，移除 dom 节点
      parentElement?.removeChild(container)
    }
  }, [container, attach])

  // 此外，通过 forwardRef + useImperativeHandle 把容器 dom 返回：
  useImperativeHandle(ref, () => container)

  return createPortal(children, container)
})

export default Portal
