import { useEffect, useRef, useState } from 'react'

export default function App() {
  const [className, setClassName] = useState('aaa')

  useEffect(() => {
    setTimeout(() => setClassName('bbb'), 2000)
  }, [])

  const containerRef = useRef(null)

  useEffect(() => {
    const targetNode = containerRef.current!

    const callback = (mutationsList: MutationRecord[]) => {
      console.log(mutationsList)
    }

    const observer = new MutationObserver(callback)

    // attributes 是监听属性变化，childList 是监听 children 变化，subtree 是连带子节点的属性、children 变化也监听。

    observer.observe(targetNode, {
      attributes: true,
      childList: true,
      subtree: true
    })
  }, [])

  return (
    <div>
      <div id='container' ref={containerRef}>
        <div className={className}>
          {className === 'aaa' ? (
            <div>aaa</div>
          ) : (
            <div>
              <p>bbb</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
