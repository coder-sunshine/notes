import { isArray, isNumber, isString, ShapeFlags } from '@vue/shared'

/**
 * 文本节点标记
 */
export const Text = Symbol('v-txt')

/**
 * 标准化处理
 * @param vnode 虚拟节点
 * @returns 标准化后的虚拟节点
 */
export function normalizeVNode(vnode) {
  if (isString(vnode) || isNumber(vnode)) {
    // 如果是 string 或者 number 转换成文本节点

    return createVNode(Text, null, String(vnode))
  }

  return vnode
}

/**
 * 判断两个虚拟节点是否是同一个类型
 * @param n1 老节点
 * @param n2 新节点
 */
export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}

/**
 * 判断是不是一个虚拟节点，根据 __v_isVNode 属性
 * @param value
 */
export function isVNode(value) {
  return value?.__v_isVNode
}

/**
 * 创建虚拟节点的底层方法
 * @param type 节点类型
 * @param props 节点的属性
 * @param children 子节点
 */
export function createVNode(type, props?, children = null) {
  let shapeFlag

  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  }

  if (isString(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

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
    shapeFlag,
  }

  return vnode
}
