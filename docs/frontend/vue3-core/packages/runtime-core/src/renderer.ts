import { ShapeFlags } from '@vue/shared'
import { isSameVNodeType, Text } from './vnode'

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
  const mountElement = (vnode, container, anchor) => {
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
    hostInsert(el, container, anchor)
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

  const patchKeyedChildren = (c1, c2, container) => {
    /**
     * 双端对比
     * 1. 头部对比
     * old: [a,b]
     * new: [a,b,c,d]
     */

    let i = 0
    // 老的子节点最后一个元素的下标
    let e1 = c1.length - 1 // 1
    // 新的子节点最后一个元素的下标
    let e2 = c2.length - 1 // 3

    // 1. 头部对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]

      // 如果是相同类型，则直接 patch 对比
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }

      i++
    }

    /**
     * 双端对比
     * 2. 尾部对比
     * old: [a,b]
     * new: [c,d,a,b]
     */

    //  尾部对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]

      // 如果是相同类型，则直接 patch 对比
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container)
      } else {
        break
      }

      e1--
      e2--
    }
    console.log(i, e1, e2)

    if (i > e1) {
      /**
       * 根据双端对比，得出结论：
       * i > e1 表示老的少，新的多，要挂载新的，挂载的范围是 i -> e2
       */
      const nextPos = e2 + 1

      const anchor = nextPos < c2.length ? c2[nextPos].el : null
      console.log(anchor)

      while (i <= e2) {
        patch(null, c2[i], container, anchor)
        i++
      }
    } else if (i > e2) {
      /**
       * 根据双端对比，得出结果：
       * i > e2 的情况下，表示老的多，新的少，要把老的里面多余的卸载掉，卸载的范围是 i - e1
       */
      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    } else {
      /**
       * 乱序对比
       */

      // 老的子节点开始查找的位置
      let s1 = i
      // 新的子节点开始查找的位置
      let s2 = i

      // 需要一个映射表，遍历新的还没有更新的 也就是 s2 -> e2 的节点，建立一个映射表
      // 然后遍历老的，看看老的节点是否在新的映射表中，如果在，则进行 patch，如果不在，则卸载
      const keyToNewIndexMap = new Map()
      console.log(e2, s2)

      // 存储新的子节点在老的子节点中的索引,必须是老的和新的都有的才需要记录
      const newIndexToOldIndexMap = new Array(e2 - s2 + 1)

      // 如果是 -1，代表不需要计算的，有可能是新增的，新的有老的没有。
      newIndexToOldIndexMap.fill(-1)

      for (let j = s2; j <= e2; j++) {
        const n2 = c2[j]
        keyToNewIndexMap.set(n2.key, j)
      }

      let pos = -1
      // 是否需要移动
      let moved = false

      // 遍历老的，看看老的节点是否在新的映射表中，如果在，则进行 patch，如果不在，则卸载
      for (let j = s1; j <= e1; j++) {
        const n1 = c1[j]
        const newIndex = keyToNewIndexMap.get(n1.key)
        console.log('newIndex', newIndex)

        // 如果有，则进行 patch
        if (newIndex != null) {
          // 如果每一次都是比上一次的大，表示就是连续递增的，不需要算
          if (newIndex > pos) {
            pos = newIndex
          } else {
            // 如果突然比上一次的小了，就表示需要移动了
            moved = true
          }

          // 新的有， 老的也有。
          newIndexToOldIndexMap[newIndex] = j

          patch(n1, c2[newIndex], container)
        } else {
          // 如果没有，则卸载
          unmount(n1)
        }
      }

      console.log('newIndexToOldIndexMap', newIndexToOldIndexMap)

      // 如果 moved 为 false，表示不需要移动，就不需要算最长递增子序列
      const newIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : []

      // 用 set 判断，性能更好点
      const sequenceSet = new Set(newIndexSequence)

      console.log('newIndexSequence', newIndexSequence)

      /**
       * 1. 遍历新的子元素，调整顺序，倒序插入
       * 2. 新的有，老的没有的，我们需要重新挂载
       */
      for (let j = e2; j >= s2; j--) {
        const n2 = c2[j]
        const anchor = c2[j + 1]?.el || null

        if (n2.el) {
          // 需要移动，再进去判断
          if (moved) {
            // 如果不在最长递增子序列，表示需要移动。
            if (!sequenceSet.has(j)) {
              // 依次进行倒序插入，保证顺序的一致性
              hostInsert(n2.el, container, anchor)
            }
          }
        } else {
          // 没有 el，说明是新节点，重新挂载就行了
          patch(null, n2, container, anchor)
        }
      }
    }
  }

  const patchChildren = (n1, n2) => {
    const el = n2.el
    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    //  新的是文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 卸载老的
        unmountChildren(n1.children)
      }

      // 老的和新的不一样
      if (n1.children !== n2.children) {
        // 将新文本设置成 children
        hostSetElementText(el, n2.children)
      }
    } else {
      /**
       * 新的是有可能 数组 或者是 null
       * 老的有可能 数组 或者是 文本 或者是 null
       */

      // 老的是文本
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 把老的文本清空
        hostSetElementText(el, '')

        // 新的是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 挂载新的
          mountChildren(n2.children, el)
        }

        // 是 null 就不管，
      } else {
        /**
         * 老的是数组 或者 null
         * 新的还是 数组 或者 null
         */

        // 老的是数组
        if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新的也是数组
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            patchKeyedChildren(n1.children, n2.children, el)
          } else {
            // 老的是数组，新的为 null
            unmountChildren(n1.children)
          }
        } else {
          // 老的是 null
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 新的是数组,挂载新的
            mountChildren(n2.children, el)
          }
        }
      }
    }
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
   * 处理元素的挂载和更新
   */
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 挂载
      mountElement(n2, container, anchor)
    } else {
      // 更新
      patchElement(n1, n2)
    }
  }

  /**
   * 处理文本的挂载和更新
   */
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      // 挂载
      const el = hostCreateText(n2.children)
      // 给 vnode 绑定 el
      n2.el = el
      // 把文本节点插入到 container 中
      hostInsert(el, container, anchor)
    } else {
      // 更新
      // 复用节点
      n2.el = n1.el
      if (n1.children != n2.children) {
        // 如果文本内容变了，就更新
        hostSetText(n2.el, n2.children)
      }
    }
  }

  /**
   * 更新和挂载，都用这个函数
   * @param n1 老节点，之前的，如果有，表示要跟 n2 做 diff，更新，如果没有，表示直接挂载 n2
   * @param n2 新节点
   * @param container 要挂载的容器
   * @param anchor 锚点
   */
  const patch = (n1, n2, container, anchor = null) => {
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

    // if (n1 == null) {
    //   // 挂载新的
    //   mountElement(n2, container, anchor)
    // } else {
    //   // 更新
    //   patchElement(n1, n2)
    // }

    /**
     * 文本，元素，组件
     */

    const { shapeFlag, type } = n2

    switch (type) {
      // 处理文本节点
      case Text:
        processText(n1, n2, container, anchor)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 处理 dom 元素 div span p h1
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          // TODO 组件
        }
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

/**
 * 获取最长递增子序列
 * @param arr 数组
 * @returns 最长递增子序列的索引
 */
function getSequence(arr) {
  // 记录结果数组，存的是索引
  const result = []

  // 记录前驱节点
  const map = new Map()

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]

    // 如果是 -1，或者是 Undefined 代表不需要计算的
    if (item === -1 || item === undefined) continue

    if (result.length === 0) {
      // 如果 result 一个都没有，就把当前的索引放进去，第一个也不用记录前驱节点
      result.push(i)
      continue
    }

    // 拿到最后一个索引
    const lastIndex = result[result.length - 1]
    // 拿到最后一个元素
    const lastItem = arr[lastIndex]

    // 当前元素大于最后一个元素
    if (item > lastItem) {
      // 直接 push ，并且记录 当前 i 的前驱节点
      result.push(i)
      map.set(i, lastIndex)
      continue
    }

    // 此时需要找到第一个比自己大的数，并且替换 --> 二分查找
    console.log('result', result)

    let left = 0
    let right = result.length - 1

    /**
     * 需要找到第一个比当前值大的值
     * 如果中间值小于当前值，那么第一个比当前值大的肯定在右边
     * 如果中间值大于当前值，那么第一个比当前值大的肯定在左边
     */
    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const midItem = arr[result[mid]]

      if (midItem < item) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    if (arr[result[left]] > item) {
      // 第一个不用记录前驱节点
      if (left > 0) {
        // 记录前驱节点
        map.set(i, result[left - 1])
      }
      // 找到最合适的，把索引替换进去
      result[left] = i
    }
  }

  // 反向追溯
  let l = result.length

  let last = result[l - 1]

  while (l > 0) {
    l--
    // 纠正顺序
    result[l] = last
    // 下一次的last等于当前last记录的前驱节点
    last = map.get(last)
  }

  return result
}
