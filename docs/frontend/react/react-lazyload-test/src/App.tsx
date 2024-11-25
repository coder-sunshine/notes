import React from 'react'
import img1 from './img1.png'
import img2 from './img2.png'
// import LazyLoad from 'react-lazyload'
import LazyLoad from './MyLazyLoad'

const LazyTest = React.lazy(() => import('./Test'))

export default function App() {
  return (
    <div>
      {/* <LazyTest /> */}
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <p>xxxxxx</p>
      <LazyLoad
        placeholder={<div>loading...</div>}
        onContentVisible={() => {
          console.log('comp visible')
        }}
      >
        {/* <img src={img1} /> */}
        <LazyTest />
      </LazyLoad>
      <LazyLoad
        placeholder={<div>loading...</div>}
        offset={300}
        onContentVisible={() => {
          console.log('img visible')
        }}
      >
        <img src={img2} />
      </LazyLoad>
    </div>
  )
}
