// import { ConfigProvider, Space } from 'antd'
import React from 'react'
import './App.scss'

import Space from './Space'
import { ConfigContext, ConfigProvider } from './Space/ConfigProvider'

// interface TestProps {
//   children: React.ReactNode[]
// }

// function Test(props: TestProps) {
//   const children2 = React.Children.toArray(props.children)

//   console.log(props.children)
//   console.log(children2)
//   console.log(children2.sort());
//   return <div></div>
// }

export default function App() {
  // return (
  //   <Test>
  //     {[[<div>111</div>, <div>222</div>], [<div>333</div>]]}
  //     <span>hello world</span>
  //   </Test>
  // )

  return (
    // <Space
    //   style={{ height: '200px', background: 'green' }}
    //   direction='horizontal'
    //   // size={'small'}
    //   size={['large', 200]}
    //   align='start'
    //   wrap={true}
    //   split={<div className='box' style={{ background: 'yellow' }}></div>}
    // >
    //   <div className='box'></div>
    //   <div className='box'></div>
    //   <div className='box'></div>
    //   <div className='box'></div>
    //   <div className='box'></div>
    //   <div className='box'></div>
    //   <div className='box'></div>
    //   <div className='box'></div>
    // </Space>

    // 可以不直接设置 size，而是通过 ConfigProvider 修改 context 中的默认值：
    // 很明显，Space 内部会读取 context 中的 size 值。

    // 这样如果有多个 Space 组件就不用每个都设置了，统一加个 ConfigProvider 就行了：
    // <ConfigProvider space={{ size: 100 }}>
    //   <Space direction='horizontal'>
    //     <div className='box'></div>
    //     <div className='box'></div>
    //     <div className='box'></div>
    //   </Space>
    // </ConfigProvider>

    // <Space direction='vertical' align='end'>
    //   <div>111</div>
    //   <div>222</div>
    //   <div>333</div>
    // </Space>

    // <Space
    //   className='container'
    //   direction='horizontal'
    //   align='center'
    //   wrap={true}
    //   size={['large', 'small']}
    //   split={<div className='split-line'>123</div>}
    // >
    //   <div className='box'></div>
    //   <div className='box'></div>
    //   <div className='box'></div>
    // </Space>

    // <ConfigContext.Provider value={{ space: { size: 20 } }}>
    //   <Space direction='horizontal'>
    //     <div className='box'></div>
    //     <div className='box'></div>
    //     <div className='box'></div>
    //   </Space>
    //   <Space direction='vertical'>
    //     <div className='box'></div>
    //     <div className='box'></div>
    //     <div className='box'></div>
    //   </Space>
    // </ConfigContext.Provider>

    <ConfigProvider space={{ size: 20 }}>
      <Space direction='horizontal' split={<div className='split-line'>123</div>}>
        <div className='box'></div>
        <div className='box'></div>
        <div className='box'></div>
      </Space>
      <Space direction='vertical'>
        <div className='box'></div>
        <div className='box'></div>
        <div className='box'></div>
      </Space>
    </ConfigProvider>
  )
}
