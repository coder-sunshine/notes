import { ReactiveFlags } from './constants'
import { activeSub } from './effect'

export class RefImpl<T = any> {
  _value: T

  // ref标记
  public readonly [ReactiveFlags.IS_REF] = true

  // 保存和 effect 之间的关联关系
  subs

  constructor(value: T) {
    this._value = value
  }

  get value() {
    // 在读取的时候，把当前的 activeSub 保存到 subs 里面
    if (activeSub) {
      console.log('读取了value', this._value)
      this.subs = activeSub
    }
    return this._value
  }

  set value(newVal) {
    console.log('设置了value', newVal)
    this._value = newVal

    // 通知 effect 重新执行，获取到最新的值
    this.subs?.()
  }
}

function createRef(rawValue: unknown) {
  // 如果是ref，则直接返回
  if (isRef(rawValue)) {
    return rawValue
  } else {
    // 如果不是ref，则创建一个ref
    return new RefImpl(rawValue)
  }
}

export function ref(value?: unknown) {
  return createRef(value)
}

/**
 * @description 判断是不是一个 ref
 * @param value
 */
export function isRef(value: any) {
  return value ? value[ReactiveFlags.IS_REF] === true : false
}
