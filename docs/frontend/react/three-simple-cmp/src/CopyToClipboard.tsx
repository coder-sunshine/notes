import React, { ReactElement } from 'react'
import copy from 'copy-to-clipboard'

interface CopyToClipboardProps {
  text: string
  onCopy: (text: string, result: boolean) => void
  children: ReactElement
  options?: {
    debug?: boolean
    message?: string
    format?: string
  }
}

const CopyToClipboard: React.FC<CopyToClipboardProps> = ({ text, onCopy, children, options = {} }) => {
  // React.Children.only 是用来断言 children 只有一个元素，如果不是就报错：
  const elem = React.Children.only(children)

  const onClick = (event: MouseEvent) => {
    const result = copy(text, options)

    if (onCopy) {
      onCopy(text, result)
    }

    if (typeof elem?.props?.onClick === 'function') {
      elem.props.onClick(event)
    }
  }

  // React.cloneElement()接收三个参数第一个参数接收一个ReactElement，可以是真实的dom结构也可以是自定义的。
  // 第二个参数返回旧元素的props、key、ref。可以添加新的props，
  // 第三个是props.children，不指定默认展示我们调用时添加的子元素。如果指定会覆盖我们调用克隆组件时里面包含的元素。
  return React.cloneElement(elem, { onClick })
}

export default CopyToClipboard
