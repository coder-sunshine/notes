import { hasChanged, isFunction } from '@vue/shared'
import { ReactiveFlags } from './constants'
import { Dependency, endTrack, link, Link, startTrack, Subscriber } from './system'
import { activeSub, setActiveSub } from './effect'

class ComputedRefImpl implements Subscriber, Dependency {
  // 计算属性也是一个 ref
  [ReactiveFlags.IS_REF] = true

  // 保存 fn 的返回值
  _value

  // 订阅者链表的头节点
  subs: Link | undefined
  // 订阅者链表的尾节点
  subsTail: Link | undefined

  // 依赖项链表的头节点
  deps: Link | undefined
  // 依赖项链表的尾节点
  depsTail: Link | undefined

  dirty = true

  constructor(
    public fn, // getter
    private setter // setter
  ) {}

  get value() {
    if (this.dirty) {
      this.update()
    }

    // 作为 dep 和 sub 建立关联关系
    if (activeSub) {
      link(this, activeSub)
    }

    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    } else {
      console.warn('我是只读的, 不能设置值')
    }
  }

  // 作为订阅者sub的实现， fn 执行期间建立 sub 和 dep 的关联
  update() {
    // fn 执行之前，保存上一次的 activeSub，也就是保存外层的 activeSub，这样内层执行完毕，恢复外层的 activeSub，继续执行，就不会有问题了
    const prevSub = activeSub

    // 将当前的 effect 保存到全局，以便于收集依赖
    setActiveSub(this)

    /**
     * 当 effect 执行完毕后，会收集到依赖，可以这样，当 effect 被通知更新的时候，把 depsTail 设置成 undefined
     * 那么此时的 depsTail 指向 undefined，deps 指向 link1，这种情况下，可以视为它之前收集过依赖，(有头无尾巴，说明手动设置过了，不是新节点)
     * 在重新执行的时候，需要尝试着去复用，那么复用谁呢？肯定是先复用第一个，然后依次往后(也就是按照顺序执行)
     */

    startTrack(this)

    try {
      // 拿到旧值
      const oldValue = this._value

      // 把 fn 的执行结果赋值给 _value, fn 执行期间建立 sub 和 dep 的关联
      this._value = this.fn()

      // 返回是否相等，让调用者自行判断是否需要重新执行 sub
      return hasChanged(oldValue, this._value)
    } finally {
      // 结束追踪，找到需要清理的依赖，断开关联关系
      endTrack(this)

      setActiveSub(prevSub)
    }
  }
}

export function computed(getterOrOptions) {
  let getter, setter

  // 只传一个函数就是 getter
  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
  } else {
    // 传对象就是 get 和 set
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}
