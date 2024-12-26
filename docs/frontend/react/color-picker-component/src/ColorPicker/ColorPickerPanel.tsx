import { CSSProperties, useState } from 'react'
import cs from 'classnames'
import './index.scss'
import { ColorType } from './interface'
import { Color } from './color'
import Palette from './Palette'
import { useControllableValue } from 'ahooks'

export interface ColorPickerProps {
  className?: string
  style?: CSSProperties
  value?: ColorType
  defaultValue?: ColorType
  onChange?: (color: Color) => void
}

function ColorPickerPanel(props: ColorPickerProps) {
  const { className, style, value, onChange } = props

  // const [colorValue, setColorValue] = useState<Color>(() => {
  //   // 在组件里判断下 value 类型，如果不是 Color，那就创建一个 Color 对象，传入 Palette：
  //   if (value instanceof Color) {
  //     return value
  //   }
  //   return new Color(value)
  // })

  const [colorValue, setColorValue] = useControllableValue<Color>(props);

  const classNames = cs('color-picker', className)

  function onPaletteColorChange(color: Color) {
    setColorValue(color)
    onChange?.(color)
  }

  return (
    <div className={classNames} style={style}>
      <Palette color={colorValue} onChange={onPaletteColorChange}></Palette>
      <div style={{ width: 20, height: 20, backgroundColor: colorValue.toRgbString() }}></div>
    </div>
  )
}

export default ColorPickerPanel
