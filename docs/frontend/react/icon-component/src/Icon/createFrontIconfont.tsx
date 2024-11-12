import React from 'react'
import { IconProps, Icon } from './index'
const loadedSet = new Set<string>()

// 创建 iconfont 组件
export const createFromIconfont = (scriptUrl: string) => {
  if (typeof scriptUrl === 'string' && scriptUrl.length && !loadedSet.has(scriptUrl)) {
    const script = document.createElement('script')
    script.setAttribute('src', scriptUrl)
    script.setAttribute('data-namespace', scriptUrl)
    document.body.appendChild(script)

    loadedSet.add(scriptUrl)
  }

  // 返回一个iconfont组件
  const Iconfont = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => {
    const { type, ...rest } = props

    return (
      <Icon ref={ref} {...rest}>
        {type ? <use xlinkHref={`#${type}`} /> : null}
      </Icon>
    )
  })

  return Iconfont
}
