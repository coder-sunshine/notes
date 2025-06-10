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

/**
 * 建立dep和sub的关联
 * @param dep
 * @param sub
 */
export function link(dep: Dependency, sub: Subscriber) {
  // 尝试复用节点
  const currentDep = sub.depsTail // 拿到当前的尾结点

  // 尾结点没值，头结点有值，说明需要复用
  if (!currentDep && sub.deps) {
    // 判断头结点的dep是否是当前的dep
    if (sub.deps.dep === dep) {
      console.log('复用当前头结点')
      sub.depsTail = sub.deps
      return
    }
  }
  console.log('创建新节点')

  // 创建一个节点
  const newLink: Link = {
    sub,
    dep, // link 关联的 响应式数据
    nextDep: undefined, // 下一个依赖项节点
    nextSub: undefined,
    prevSub: undefined,
  }

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

/**
 * 传播更新
 * @param subs
 */
export function propagate(subs: Link) {
  let link = subs

  // 创建一个 sub 的 队列，处理完后依次执行
  let queuedEffect = []

  while (link) {
    queuedEffect.push(link.sub)
    link = link.nextSub
  }

  // 拿到所有的sub执行
  queuedEffect.forEach(effect => effect.notify())
}
