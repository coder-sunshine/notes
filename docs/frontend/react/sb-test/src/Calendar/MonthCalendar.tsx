import { Dayjs } from 'dayjs'
import { CalendarProps } from './index'
import { useContext } from 'react'
import LocaleContext from './LocaleContext'
import allLocales from './locale/index'
import cs from 'classnames'

interface MonthCalendarProps extends CalendarProps {
  selectHandler: (date: Dayjs) => void
  curMonth: Dayjs
}

const getAllDays = (date: Dayjs) => {
  // 获取一个月有多少天
  const daysInMonth = date.daysInMonth()
  console.log(daysInMonth)

  // 获取一个月的第一天
  const startDate = date.startOf('month')

  // 获取一个月的第一天是星期几
  const day = startDate.day()

  const daysInfo: Array<{ date: Dayjs; currentMonth: boolean }> = new Array(6 * 7)

  // 填充一个月的第一天前面的空白
  for (let i = 0; i < day; i++) {
    daysInfo[i] = {
      date: startDate.subtract(day - i, 'day'),
      currentMonth: false // 不是当月的日期
    }
  }

  // 填充一个月的所有天
  for (let i = day; i < daysInfo.length; i++) {
    const calcDate = startDate.add(i - day, 'day')
    daysInfo[i] = {
      date: startDate.add(i - day, 'day'),
      currentMonth: calcDate.month() === date.month()
    }
  }

  return daysInfo
}

const MonthCalendar: React.FC<MonthCalendarProps> = props => {
  const localeContext = useContext(LocaleContext)

  const { value, curMonth, dateRender, dateInnerContent, selectHandler } = props

  const CalendarLocale = allLocales[localeContext.locale]

  const weekList = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  const allDays = getAllDays(curMonth)

  const renderDays = (days: Array<{ date: Dayjs; currentMonth: boolean }>) => {
    const rows = []
    for (let i = 0; i < 6; i++) {
      const row = []
      for (let j = 0; j < 7; j++) {
        const item = days[i * 7 + j]
        row[j] = (
          <div
            key={i * 7 + j}
            className={'calendar-month-body-cell ' + (item.currentMonth ? 'calendar-month-body-cell-current' : '')}
            onClick={() => selectHandler?.(item.date)}
          >
            {dateRender ? (
              dateRender(item.date)
            ) : (
              <div className='calendar-month-body-cell-date'>
                <div
                  className={cs(
                    'calendar-month-body-cell-date-value',
                    value?.format('YYYY-MM-DD') === item.date.format('YYYY-MM-DD')
                      ? 'calendar-month-body-cell-date-selected'
                      : ''
                  )}
                >
                  {item.date.date()}
                </div>
                <div className='calendar-month-body-cell-date-content'>{dateInnerContent?.(item.date)}</div>
              </div>
            )}
          </div>
        )
      }
      rows.push(row)
    }
    return rows.map((row, index) => (
      <div className='calendar-month-body-row' key={index}>
        {row}
      </div>
    ))
  }

  return (
    <div className='calendar-month'>
      <div className='calendar-month-week-list'>
        {weekList.map(week => (
          <div className='calendar-month-week-list-item' key={week}>
            {CalendarLocale.week[week]}
          </div>
        ))}
      </div>
      <div className='calendar-month-body'>{renderDays(allDays)}</div>
    </div>
  )
}

export default MonthCalendar
