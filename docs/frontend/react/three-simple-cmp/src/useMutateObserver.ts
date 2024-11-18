import { useEffect } from 'react'

const defaultOptions: MutationObserverInit = {
  subtree: true,  // observe the entire subtree
  childList: true,  // observe added/removed child nodes
  attributeFilter: ['style', 'class'] // observe style and class changes
}

export default function useMutateObserver(
  nodeOrList: HTMLElement | HTMLElement[],
  callback: MutationCallback,
  options: MutationObserverInit = defaultOptions
) {
  useEffect(() => {
    if (!nodeOrList) {
      return
    }

    let instance: MutationObserver

    const nodeList = Array.isArray(nodeOrList) ? nodeOrList : [nodeOrList]

    if ('MutationObserver' in window) {
      instance = new MutationObserver(callback)

      nodeList.forEach(element => {
        instance.observe(element, options)
      })
    }
    return () => {
      // 在销毁的时候，调用 takeRecords 删掉所有剩余通知，调用 disconnect 停止接收新的通知：
      instance?.takeRecords()
      instance?.disconnect()
    }
  }, [options, nodeOrList])
}
