import { ShapeFlags } from '@vue/shared'
import { isSameVNodeType } from './vnode'

export function createRenderer(options) {
  // 拿到 nodeOps 里面的操作 Dom 方法
  // 拿到 patchProp 方法，用来处理 props
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    createText: hostCreateText,
    setText: hostSetText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPatchProp,
  } = options

  // 卸载子元素
  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  // 卸载
  const unmount = vnode => {
    const { shapeFlag, children } = vnode
    // 如果子节点是数组，则递归卸载
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children)
    }

    // 移除dom元素
    hostRemove(vnode.el)
  }

  // 挂载子元素
  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      // 递归挂载子节点
      // n1 为 null，表示直接挂载
      patch(null, children[i], container)
    }
  }

  // 挂载节点
  const mountElement = (vnode, container) => {
    /**
     * 1. 创建一个 dom 节点
     * 2. 设置它的 props
     * 3. 挂载它的子节点
     */
    const { type, props, shapeFlag, children } = vnode

    // 1. 创建 Dom 元素 type --> div  p  span 等
    const el = hostCreateElement(type)

    // 给 vnode 上的 el 属性赋值，后续可以方便获取到 Dom 元素，做更新，卸载等操作
    vnode.el = el

    // 2. 设置它的 props
    for (const key in props) {
      // prevValue 为 null，因为是挂载操作，之前的没有值
      hostPatchProp(el, key, null, props[key])
    }

    // 3. 挂载它的子节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 子节点是文本
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 子节点是数组
      mountChildren(children, el)
    }

    // 处理完后把 el 插入到 container 中
    hostInsert(el, container)
  }

  const patchProps = (el, oldProps, newProps) => {
    // 清楚旧属性
    if (oldProps) {
      for (const key in oldProps) {
        hostPatchProp(el, key, oldProps[key], null)
      }
    }

    // 设置新属性
    if (newProps) {
      for (const key in newProps) {
        hostPatchProp(el, key, null, newProps[key])
      }
    }
  }

  const patchChildren = (n1, n2) => {
    console.log('patchChildren')
    console.log(n1)
    console.log(n2)
  }

  const patchElement = (n1, n2) => {
    /**
     * 1. 复用 dom 元素
     * 2. 更新 props
     * 3. 更新 children
     */
    // 复用 dom 元素 每次进来，都拿上一次的 el，保存到最新的虚拟节点上 n2.el  const el = (n2.el = n1.el)
    n2.el = n1.el
    const el = n2.el

    // 更新 el 的 props
    const oldProps = n1.props
    const newProps = n2.props
    patchProps(el, oldProps, newProps)

    // 更新 children
    patchChildren(n1, n2)
  }

  /**
   * 更新和挂载，都用这个函数
   * @param n1 老节点，之前的，如果有，表示要跟 n2 做 diff，更新，如果没有，表示直接挂载 n2
   * @param n2 新节点
   * @param container 要挂载的容器
   */
  const patch = (n1, n2, container) => {
    // 如果 n1 和 n2 一样，则不需要做任何操作
    if (n1 === n2) {
      return
    }

    // 如果两个节点类型不一样，则直接销毁老的，创建新的
    if (n1 && !isSameVNodeType(n1, n2)) {
      // 比如说 n1 是 div ，n2 是 span，这俩就不一样，或者 n1 的 key 是1，n2 的 key 是 2，也不一样，都要卸载掉 n1
      // 如果两个节点不是同一个类型，那就卸载 n1 直接挂载 n2
      unmount(n1)
      // 把 n1 设置为 null, 那么走到下面判断 就是走挂载新的逻辑
      n1 = null
    }

    if (n1 == null) {
      // 挂载新的
      mountElement(n2, container)
    } else {
      // 更新
      console.log('更新')
      patchElement(n1, n2)
    }
  }
  // 提供虚拟节点 渲染到页面上的功能

  const render = (vnode, container) => {
    /**
     * 分三个步骤：
     * 1. 挂载：如果容器中没有之前的虚拟节点（container._vnode），则直接将新的虚拟节点挂载到容器中。
     * 2. 更新：如果容器中有之前的虚拟节点，则对比新旧虚拟节点，并进行更新操作。
     * 3. 卸载：如果传入的虚拟节点为 null，则卸载容器中现有的虚拟节点。
     */

    if (vnode == null) {
      // 卸载
      if (container._vnode) {
        unmount(container._vnode)
      }
    } else {
      // 挂载或者是更新流程
      patch(container._vnode || null, vnode, container)
    }

    // 把最新的 vnode 保存到 container 中，以便于下一次 diff 或者 卸载
    container._vnode = vnode
  }

  return {
    render,
  }
}
