import React, { useEffect, useRef } from 'react'
// import Calendar, { type CalendarRef } from './components/MiniCalendar/index'
import Calendar, { type CalendarRef } from './components/MiniCalendar/index2'


const Test: React.FC = () => {
  const calendarRef = useRef<CalendarRef>(null)

  useEffect(() => {
    console.log(calendarRef.current?.getDate().toLocaleDateString())

    setTimeout(() => {
      // calendarRef.current?.setDate(new Date(2024, 3, 1))
      calendarRef.current?.setDate(new Date(2024, 8, 15))
    }, 3000)
  }, [])

  return (
    <div>
      {/* <Calendar defaultValue={new Date('2023-3-1')} onChange={(date: Date) => {
        alert(date.toLocaleDateString());
    }}></Calendar> */}
      <Calendar ref={calendarRef} defaultValue={new Date('2024-8-15')}></Calendar>
    </div>
  )
}
export default Test
