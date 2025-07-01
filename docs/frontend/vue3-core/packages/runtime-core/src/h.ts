import { isArray, isObject } from '@vue/shared'
import { createVNode, isVNode } from './vnode'

/**
 * h 函数，主要的作用是对 createVNode 做一个参数标准化（归一化）
 */
export function h(type, propsOrChildren?, children?) {
  // 根据参数的长度先做判断，
  const l = arguments.length

  if (l === 2) {
    // 长度为 2 第二个参数，有可能是 props, 也有可能是 children
    // 判断第二个参数是否是数组
    if (isArray(propsOrChildren)) {
      // h('div', [h('span', 'hello'), h('span', ' world')])
      return createVNode(type, null, propsOrChildren)
    }

    // 如果第二个参数是对象，则有可能是 props 或者是 一个虚拟节点（虚拟DOM就是对象）
    if (isObject(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        // h('div', h('span', 'hello'))
        return createVNode(type, null, [propsOrChildren])
      } else {
        // h('div', { class: 'container' })
        return createVNode(type, propsOrChildren, null)
      }
    }

    // h('div', 'hello world') 第三个参数是字符串,字符串直接传就行了，其他的需要包装成数组
    return createVNode(type, null, propsOrChildren)
  } else {
    if (l > 3) {
      /**
       * h('div', { class: 'container' }, h('span', 'hello'), h('span', 'world'))
       * 转换成
       * h('div', { class: 'container' }, [h('span', 'hello'), h('span', 'world')])
       */
      // 从第三个开始截取，合并成一个数组
      children = [...arguments].slice(2)
    } else if (isVNode(children)) {
      // h('div', { class: 'container' }, h('span', 'hello world'))
      // createVNode第三个参数不是字符串就是数组
      children = [children]
    }

    // 要是只传了 type,就只渲染一个type就行了，例如 div
    return createVNode(type, propsOrChildren, children)
  }
}
