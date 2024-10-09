// import { useEffect, useRef } from 'react'

// function App() {
//   const inputRef = useRef<HTMLInputElement>(null)

//   useEffect(() => {
//     inputRef.current?.focus()
//   })

//   return (
//     <div>
//       <input ref={inputRef}></input>
//     </div>
//   )
// }

// export default App

import { useRef, useState } from 'react'

function App() {
  const numRef = useRef<number>(0)

  const [, forceRender] = useState(0)

  return (
    <div>
      <div
        onClick={() => {
          numRef.current += 1
          forceRender(Math.random())
        }}
      >
        {numRef.current}
      </div>
    </div>
  )
}

export default App
