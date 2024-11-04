import dayjs from 'dayjs'
import Calendar from './components/Calendar'
import { useState } from 'react'

const App6 = () => {
  const [value, setValue] = useState(dayjs('2023-11-08'))
  return (
    <div className='App'>
      {/* <Calendar
      locale='en-US'
        defaultValue={dayjs('2024-10-30')}
        dateInnerContent={value => {
          return (
            <div>
              <p style={{ background: 'yellowgreen', height: '30px' }}>{value.format('YYYY/MM/DD')}</p>
            </div>
          )
        }}
      /> */}
      <Calendar
        value={value}
        onChange={val => {
          setValue(val)
          alert(val.format("YYYY-MM-DD"))
        }}
      ></Calendar>
    </div>
  )
}

export default App6
