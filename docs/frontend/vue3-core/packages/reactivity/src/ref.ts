import { hasChanged, isObject } from '@vue/shared'
import { ReactiveFlags } from './constants'
import { activeSub } from './effect'
import { Dependency, link, Link, propagate } from './system'
import { reactive } from './reactive'

export class RefImpl<T = any> implements Dependency {
  _value: T

  // ref标记
  public readonly [ReactiveFlags.IS_REF] = true

  /**
   * 订阅者链表的头节点
   */
  subs: Link

  /**
   * 订阅者链表的尾节点
   */
  subsTail: Link

  constructor(value: T) {
    // 如果 value 是对象，那么就使用 reactive 转换成响应式对象
    this._value = isObject(value) ? reactive(value) : value
  }

  get value() {
    if (activeSub) {
      trackRef(this)
    }
    return this._value
  }

  set value(newVal) {
    if (hasChanged(newVal, this._value)) {
      // 只有在 值发生变化之后，才触发更新
      // 触发更新
      this._value = isObject(newVal) ? reactive(newVal) : newVal

      triggerRef(this)
    }
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

/**
 * 收集依赖，建立 ref 和 effect 之间的链表关系
 * @param dep
 */
export function trackRef(dep: Dependency) {
  link(dep, activeSub)
}

/**
 * 通知dep关联的sub重新执行
 * @param dep
 */
export function triggerRef(dep: Dependency) {
  dep.subs && propagate(dep.subs)
}

class ObjectRefImpl {
  constructor(
    public _object: object,
    public _key: string
  ) {}

  // 为传入的 值 和 key 创建 getter 和 setter，还是相当于访问原对象
  get value() {
    return this._object[this._key]
  }

  set value(newVal) {
    this._object[this._key] = newVal
  }
}

export function toRef(source: Record<string, any>, key: string) {
  if (isRef(source)) {
    return source
  }

  return new ObjectRefImpl(source, key)
}

export function toRefs(source: Record<string, any>) {
  // TODO: 这里还需要判断下是不是响应式数据
  const res = {}

  for (const key in source) {
    res[key] = new ObjectRefImpl(source, key)
  }

  return res // a => ObjectRefImpl, b => ObjectRefImpl
}
