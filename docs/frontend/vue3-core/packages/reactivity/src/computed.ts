import { isFunction } from '@vue/shared'
import { ReactiveFlags } from './constants'
import { Dependency, Link, Subscriber } from './system'

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
    console.log('读取了value')
    this._value = this.fn()
    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    } else {
      console.warn('我是只读的, 不能设置值')
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
