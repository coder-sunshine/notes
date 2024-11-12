import React, { FC } from 'react'

interface AaaProps {
  // children: React.ReactNode
  // children: React.ReactNode[]
  children: React.ReactNode
}

const Aaa: FC<AaaProps> = props => {
  const { children } = props

  return (
    <div className='container'>
      {/* {React.Children.map(children, item => {
        return <div className='item'>{item}</div>
      })} */}

      {/* 如果children是数组，则使用map遍历，那么类型就要声明为 React.ReactNode[]，也就导致外面如果只有一个子元素，那么就会报错 */}
      {/* {children.map(item => {
        return <div className='item'>{item}</div>
      })} */}

      {React.Children.map(children, item => {
        return <div className='item'>{item}</div>
      })}
    </div>
  )
}

function App() {
  return (
    // <Aaa>
    //   <a href='#'>111</a>
    //   {/* <a href='#'>222</a>
    //   <a href='#'>333</a> */}
    // </Aaa>

    // 更重要的是当 children 传数组的时候：渲染的时候会把后面的 222 444 当成一个整体，而不是一个一个的元素，而使用 React.Children.map 则不会
    <Aaa>{[<span>111</span>, <span>333</span>, [<span>444</span>, <span>222</span>]]}</Aaa>
  )
}

export default App
