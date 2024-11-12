import { IconEmail } from './Icon/icons/IconEmail'
import { IconAdd } from './Icon/icons/IconAdd'
import { useEffect, useRef } from 'react'
import { createFromIconfont } from './Icon/createFrontIconfont'

const IconFont = createFromIconfont('//at.alicdn.com/t/c/font_4443338_a2wwqhorbk4.js')

function App() {
  const addRef = useRef(null)

  useEffect(() => {
    console.log(addRef.current)
  }, [])

  return (
    <div style={{ padding: '50px' }}>
      <IconAdd ref={addRef}></IconAdd>
      <IconEmail></IconEmail>

      <IconAdd size='40px'></IconAdd>
      <IconEmail spin></IconEmail>
      <IconEmail style={{ color: 'blue', fontSize: '50px' }}></IconEmail>

      <IconFont type='icon-shouye-zhihui' size='40px'></IconFont>
      <IconFont type='icon-gerenzhongxin-zhihui' fill='blue' size='40px'></IconFont>
    </div>
  )
}

export default App
