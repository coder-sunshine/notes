import { isArray, isObject, ShapeFlags } from '@vue/shared'

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

/**
 * 判断是不是一个虚拟节点，根据 __v_isVNode 属性
 * @param value
 */
function isVNode(value) {
  return value?.__v_isVNode
}

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
export function createVNode(type, props?, children?) {
  const vnode = {
    // 证明是一个虚拟DOM
    __v_isVNode: true,
    type,
    props,
    // 做 diff 算法
    key: props?.key,
    children,
    // 虚拟节点要挂载的元素
    el: null,
    shapeFlag: 9,
  }

  return vnode
}

let shapeFlag = 0

const vnode = {
  __v_isVNode: true,
  type: 'div',
  children: [h('span', 'hello'), h('span', ' world')],
  shapeFlag,
}

// 如果是一个dom元素，例如 div p 等
if (typeof vnode.type === 'string') {
  shapeFlag = ShapeFlags.ELEMENT // 1
}

// 如果 children 是一个 string
if (typeof vnode.children === 'string') {
  /**
   * 或运算
   * 0001
   * 1000
   * 1001
   */
  shapeFlag = shapeFlag | ShapeFlags.TEXT_CHILDREN // 1001
}


// 如果 children 是一个数组
if (isArray(vnode.children)) {
  shapeFlag = shapeFlag | ShapeFlags.ARRAY_CHILDREN // 10000
}

vnode.shapeFlag = shapeFlag

if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
  /**
   * 与运算
   * 1001
   * 0001
   * 0001
   */
  console.log('是一个 dom 元素')
}

if (vnode.shapeFlag & ShapeFlags.TEXT_CHILDREN) {
  /**
   * 与运算 两个相同的位置，都是1，就是1
   * 1001
   * 1000
   * 1000
   */
  console.log('子元素是一个纯文本节点')
}

if (vnode.shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
  /**
   * 与运算
   * 01001
   * 10000
   * 00000
   */
  console.log('子元素是一个数组')
}