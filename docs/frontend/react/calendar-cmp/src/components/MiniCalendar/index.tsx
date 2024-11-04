import { useState, ForwardRefRenderFunction, forwardRef, useImperativeHandle } from 'react'
import './index.css'

interface CalendarProps {
  defaultValue?: Date
  onChange?: (date: Date) => void
}

export interface CalendarRef {
  getDate: () => Date
  setDate: (date: Date) => void
}

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const InternalCalendar: ForwardRefRenderFunction<CalendarRef, CalendarProps> = (props, ref) => {
  const { defaultValue, onChange } = props

  const [date, setDate] = useState(defaultValue || new Date())

  useImperativeHandle(ref, () => {
    return {
      getDate() {
        return date
      },
      setDate(date: Date) {
        setDate(date)
      }
    }
  })

  // 上个月
  const handlePrevMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
  }

  // 下个月
  const handleNextMonth = () => {
    setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
  }

  // 一个月多少天
  const daysOfMonth = (year: number, month: number) => {
    // date 传 0 的时候，取到的是上个月的最后一天：
    return new Date(year, month + 1, 0).getDate()
  }

  // 前月的第一天是星期几
  const firstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const renderDates = () => {
    const days = []
    const daysCount = daysOfMonth(date.getFullYear(), date.getMonth())
    const firstDay = firstDayOfMonth(date.getFullYear(), date.getMonth())

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className='empty'></div>)
    }

    for (let i = 1; i <= daysCount; i++) {
      const clickHandler = () => {
        const curDate = new Date(date.getFullYear(), date.getMonth(), i)
        setDate(curDate)
        onChange?.(curDate)
      }

      if (i === date.getDate()) {
        days.push(
          <div key={i} className='day selected' onClick={() => clickHandler()}>
            {i}
          </div>
        )
      } else {
        days.push(
          <div key={i} className='day' onClick={() => clickHandler()}>
            {i}
          </div>
        )
      }
    }
    return days
  }

  return (
    <div className='calendar'>
      <div className='header'>
        <button onClick={handlePrevMonth}>&lt;</button>
        <div>
          {date.getFullYear()} 年 {monthNames[date.getMonth()]}
        </div>
        <button onClick={handleNextMonth}>&gt;</button>
      </div>
      <div className='days'>
        <div className='day'>日</div>
        <div className='day'>一</div>
        <div className='day'>二</div>
        <div className='day'>三</div>
        <div className='day'>四</div>
        <div className='day'>五</div>
        <div className='day'>六</div>
        {renderDates()}
      </div>
    </div>
  )
}

const Calendar = forwardRef(InternalCalendar)

export default Calendar
