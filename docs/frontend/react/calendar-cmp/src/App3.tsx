import { useEffect, useRef, useState } from 'react'

interface CalendarProps {
  value?: Date
  defaultValue?: Date
  onChange?: (date: Date) => void
}

const Calendar: React.FC<CalendarProps> = props => {
  const { value: propsValue, defaultValue, onChange } = props

  const isControlled = propsValue !== undefined

  const [value, setValue] = useState(() => {
    // 受控
    if (isControlled) {
      return propsValue
    } else {
      // 非受控
      return defaultValue
    }
  })

  const isFirstRender = useRef(true)

  useEffect(() => {
    // 非受控 并且 非第一次渲染 (不是首次渲染，但 value 变为 undefined 的情况，也就是从受控模式切换到了非受控模式，要同步设置 state 为 propsValue。)
    if (!isControlled && !isFirstRender.current) {
      setValue(propsValue)
    }
    isFirstRender.current = false
  }, [propsValue])

  const mergedValue = isControlled ? propsValue : value

  const changeValue = (date: Date) => {
    // 非受控需要更新内部 value
    if (!isControlled) {
      setValue(date)
    }
    onChange?.(date)
  }

  return (
    <div>
      {mergedValue?.toLocaleDateString()}
      <div
        onClick={() => {
          changeValue(new Date('2024-5-1'))
        }}
      >
        2023-5-1
      </div>
      <div
        onClick={() => {
          changeValue(new Date('2024-5-2'))
        }}
      >
        2023-5-2
      </div>
      <div
        onClick={() => {
          changeValue(new Date('2024-5-3'))
        }}
      >
        2023-5-3
      </div>
    </div>
  )
}

function App() {
  return (
    <Calendar
      defaultValue={new Date('2024-5-1')}
      onChange={date => {
        console.log(date.toLocaleDateString())
      }}
    />
  )
}

export default App
