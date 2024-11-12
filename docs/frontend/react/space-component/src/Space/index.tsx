import classNames from 'classnames'
import React from 'react'

import './index.scss'
import { ConfigContext } from './ConfigProvider'

export type SizeType = 'small' | 'middle' | 'large' | number | undefined

// 这里继承了 HTMLAttributes<HTMLDivElement> 类型，那就可以传入各种 div 的属性。
export interface SpaceProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  style?: React.CSSProperties
  size?: SizeType | [SizeType, SizeType] // 传单个值代表横竖间距，或者传一个数组，分别设置横竖间距。
  direction?: 'horizontal' | 'vertical'
  align?: 'start' | 'end' | 'center' | 'baseline'
  split?: React.ReactNode
  wrap?: boolean
}

const spaceSize = {
  small: 8,
  middle: 16,
  large: 24
}

const getNumberSize = (size: SizeType) => {
  return typeof size === 'string' ? spaceSize[size] : size || 0
}

const Space: React.FC<SpaceProps> = props => {
  const { space } = React.useContext(ConfigContext)

  const {
    className,
    style,
    children,
    size = space?.size || 'small',
    direction = 'horizontal',
    align,
    split,
    wrap = false,
    ...otherProps
  } = props

  const childNodes = React.Children.toArray(children)

  const mergedAlign = direction === 'horizontal' && align === undefined ? 'center' : align

  const cn = classNames(
    'space',
    `space-${direction}`,
    {
      [`space-align-${mergedAlign}`]: mergedAlign
    },
    className
  )

  const nodes = childNodes.map((child: any, index) => {
    const key = (child && child.key) || `space-item-${index}`
    return (
      <>
        <div className='space-item' key={key}>
          {child}
        </div>
        {split && childNodes.length > 1 && index < childNodes.length - 1 && (
          <span className={`${className}-split`} style={style}>
            {split}
          </span>
        )}
      </>
    )
  })

  const otherStyles: React.CSSProperties = {}

  const [horizontalSize, verticalSize] = React.useMemo(
    () => (Array.isArray(size) ? size : ([size, size] as [SizeType, SizeType])).map(item => getNumberSize(item)),
    [size]
  )

  otherStyles.columnGap = horizontalSize
  otherStyles.rowGap = verticalSize

  if (wrap) {
    otherStyles.flexWrap = 'wrap'
  }

  return (
    <div className={cn} style={{ ...otherStyles, ...style }} {...otherProps}>
      {nodes}
    </div>
  )
}

export default Space
