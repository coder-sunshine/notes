/**
 * 依赖项
 */
export interface Dependency {
  // 订阅者链表的头节点
  subs?: Link
  // 订阅者链表的尾节点
  subsTail?: Link
}

/**
 * 订阅者
 */
export interface Subscriber {
  // 依赖项链表的头节点
  deps?: Link
  // 依赖项链表的尾节点
  depsTail?: Link

  // 是否在收集依赖，在收集依赖的时候，不触发 effect 执行
  tracking?: boolean

  // 处理 effect 收集相同依赖的问题
  dirty: boolean
}

/**
 * 链表节点
 */
export interface Link {
  // 订阅者
  sub: Subscriber
  // 下一个订阅者节点
  nextSub?: Link
  // 上一个订阅者节点
  prevSub?: Link
  // 依赖项
  dep?: Dependency
  // 下一个依赖项节点
  nextDep?: Link
}

let linkPool: Link | undefined

/**
 * 建立dep和sub的关联
 * @param dep
 * @param sub
 */
export function link(dep: Dependency, sub: Subscriber) {
  // 尝试复用节点
  const currentDep = sub.depsTail // 拿到当前的尾结点
  /**
   * 分两种情况：
   * 1. 如果头节点有，尾节点没有，那么尝试着复用头节点
   * 2. 如果尾节点还有 nextDep，尝试复用尾节点的 nextDep
   */

  // nextDep 为尝试复用的节点，如果尾节点为 undefined，那么就取头结点复用。
  // 如果尾节点有值，说明是多个节点，那么就取尾结点的下一个节点复用
  const nextDep = currentDep === undefined ? sub.deps : currentDep.nextDep

  // nextDep 没值，代表 头结点都没，需要新建节点
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  // 创建节点之前，看看能不能复用上 linkPool
  let newLink: Link = undefined

  if (linkPool) {
    // 复用 linkPool
    newLink = linkPool
    // 把linkPool设置为linkPool中的下一个依赖
    linkPool = linkPool.nextDep
    // nextDep 等于没有复用掉的 dep
    newLink.nextDep = nextDep
    newLink.sub = sub
    newLink.dep = dep
  } else {
    // 如果没有，就创建新的
    newLink = {
      sub,
      dep,
      nextDep,
      nextSub: undefined,
      prevSub: undefined,
    }
  }

  // // 创建一个节点
  // const newLink: Link = {
  //   sub,
  //   dep, // link 关联的 响应式数据
  //   nextDep, // 将没复用上的节点作为新节点的 nextDep
  //   nextSub: undefined,
  //   prevSub: undefined,
  // }

  // 如果尾结点有，说明头结点肯定有
  if (dep.subsTail) {
    // 把新节点加到尾结点
    dep.subsTail.nextSub = newLink
    // 把新节点 prevSub 指向原来的尾巴
    newLink.prevSub = dep.subsTail
    // 更新尾结点
    dep.subsTail = newLink
  } else {
    dep.subs = dep.subsTail = newLink
  }

  /**
   * 将链表节点和 sub 建立对应关系
   * 关联链表关系，分两种情况
   * 1. 尾节点有，那就往尾节点后面加
   * 2. 如果尾节点没有，则表示第一次关联，那就往头节点加，头尾相同
   */
  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = sub.depsTail = newLink
  }
}

function processComputedUpdate(computed) {
  // 1. 调用 computed 的 update 方法更新值
  // 2. 通知 subs 链表上面的 所有 sub 重新执行

  // 计算属性没关联 sub 就算关联的dep变了，也不重新执行
  if (computed.subs) {
    computed.update()
    propagate(computed.subs)
  }
}

/**
 * 传播更新
 * @param subs
 */
export function propagate(subs: Link) {
  let link = subs

  // 创建一个 sub 的 队列，处理完后依次执行
  let queuedEffect = []

  while (link) {
    const sub = link.sub
    // 如果sub正在收集依赖，则不触发effect执行
    // 不是脏的 effect，才能进入，因为脏的 effect 已经执行过了
    if (!sub.tracking && !sub.dirty) {
      // 一进来就设置为脏，当 effect 的 dep 是相同的时候，那么 sub 相同，那么 dirty 就是脏的，就不会重新执行了
      // 无论是 computed 还是 effect 都需要将 dirty 设置为 true
      sub.dirty = true
      // 如果有 update 方法，则代表是 computed 的 sub, ComputedRefImpl 上实现了 update 方法
      if ('update' in sub) {
        processComputedUpdate(sub)
      } else {
        queuedEffect.push(sub)
      }
    }

    link = link.nextSub
  }
  // 拿到所有的sub执行
  queuedEffect.forEach(effect => effect.notify())
}

/**
 * 开始追踪依赖，将tracking设置为true，将depsTail，尾节点设置成 undefined
 * @param sub
 */
export function startTrack(sub: Subscriber) {
  sub.tracking = true
  sub.depsTail = undefined
}

/**
 * 结束追踪，将tracking设置为false，找到需要清理的依赖，断开关联关系
 * @param sub
 */
export function endTrack(sub: Subscriber) {
  sub.tracking = false
  const depsTail = sub.depsTail

  // 追踪完了，不脏了
  sub.dirty = false

  /**
   * depsTail 有，并且 depsTail 还有 nextDep ，就把它们的依赖关系清理掉
   * depsTail 没有，并且头节点有，那就把所有的都清理掉（这个是没有收集到依赖，比如在 effect 第一句写个判断，为真执行下面，为假直接return ，那么后面就不用收集依赖了 ）
   */

  if (depsTail) {
    if (depsTail.nextDep) {
      // 将需要清理的依赖传进去
      clearTracking(depsTail.nextDep)
      // 清理完毕后，将 depsTail.nextDep 设置成 undefined
      depsTail.nextDep = undefined
    }
  } else if (sub.deps) {
    clearTracking(sub.deps)
    // 清理完毕后，将 sub.deps 设置成 undefined
    sub.deps = undefined
  }
}

/**
 * 清理依赖关系
 * @param link
 */
function clearTracking(link: Link) {
  // 清理依赖
  while (link) {
    const { dep, nextDep, nextSub, prevSub } = link

    // 如果当前 link 的 prevSub 有值，则代表不是头节点，则把上一个的 nextSub 指向 link 的 nextSub
    if (prevSub) {
      // 把上一个的 nextSub 指向 link 的 nextSub
      prevSub.nextSub = nextSub
      // 把 link 的 nextSub 断开
      link.nextSub = undefined
    } else {
      // prevSub 没值，则代表是头节点，则把头结点指向 nextSub
      dep.subs = nextSub
    }

    // 如果下一个有，那就把 nextSub 的上一个节点，指向当前节点的上一个节点
    if (nextSub) {
      nextSub.prevSub = prevSub
      // 断开 link 的 prevSub
      link.prevSub = undefined
    } else {
      // 如果下一个没有，那它就是尾节点，把 dep.depsTail 指向上一个节点
      dep.subsTail = prevSub
    }

    // 最后断开 link 的 dep sub 以及 nextDep
    link.dep = link.sub = undefined

    // 把 link.nextDep 指向linkPool，不写这个的话 有多个依赖，while循环的时候 等于 linkPool 永远就只有 link 节点一个了, 如果要复用多个就不行了
    link.nextDep = linkPool

    // linkPool 保存 被清理掉的 link
    linkPool = link

    link = nextDep
  }
}
