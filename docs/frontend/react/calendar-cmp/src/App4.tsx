import { useState } from 'react'
import useMergeState from './hooks/useMergeState'

interface CalendarProps {
  value?: Date
  defaultValue?: Date
  onChange?: (date: Date) => void
}

const Calendar: React.FC<CalendarProps> = props => {
  const [mergedValue, setValue] = useMergeState(new Date(), props)

  return (
    <div>
      {mergedValue?.toLocaleDateString()}
      <div
        onClick={() => {
          setValue(new Date('2024-5-1'))
        }}
      >
        2023-5-1
      </div>
      <div
        onClick={() => {
          setValue(new Date('2024-5-2'))
        }}
      >
        2023-5-2
      </div>
      <div
        onClick={() => {
          setValue(new Date('2024-5-3'))
        }}
      >
        2023-5-3
      </div>
    </div>
  )
}

function App() {
  const [value, setValue] = useState(new Date('2024-5-1'))

  return (
    // 非受控模式
    // <Calendar
    //   defaultValue={new Date('2024-5-1')}
    //   onChange={date => {
    //     console.log(date.toLocaleDateString())
    //   }}
    // />

    // 受控模式
    <Calendar
      value={value}
      onChange={date => {
        console.log(date.toLocaleDateString())
        setValue(date)
      }}
    />
  )
}

export default App
