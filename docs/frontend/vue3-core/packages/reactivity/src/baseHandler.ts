import { hasChanged, isObject } from '@vue/shared'
import { track, trigger } from './dep'
import { isRef } from './ref'
import { reactive } from './reactive'

export const mutableHandlers = {
  get(target, key, receiver) {
    /**
     * 收集依赖
     * 绑定 target 中的某一个 key 和 sub 之间的关系
     */
    track(target, key)

    const res = Reflect.get(target, key, receiver)

    // ref 对象，需要返回 value
    if (isRef(res)) {
      return res.value
    }

    /**
     * 如果 res 是一个对象，那就包装成 reactive
     */
    if (isObject(res)) {
      return reactive(res)
    }

    return res
  },
  set(target, key, newValue, receiver) {
    // 拿到旧值
    const oldValue = target[key]

    // 拿到数组更新之前的 length
    const targetIsArray = Array.isArray(target)
    const oldLength = targetIsArray ? target.length : 0

    /**
     * 如果更新了 state.count 它之前是个 ref，那么会修改原始的 ref.value 的值 等于 newValue
     * 如果 newValue 是一个 ref，那就不修改
     */

    if (isRef(oldValue) && !isRef(newValue)) {
      // 这里修改了 ref 的值，是会触发 ref 的 set的，直接走 ref 的更新逻辑就行，直接返回 true,
      // Reflect.set 放后面执行
      oldValue.value = newValue
      return true
    }

    // 这句代码执行之后，target[key] 的值就变成了 newValue， 顺序不能写反
    const res = Reflect.set(target, key, newValue, receiver)

    if (hasChanged(oldValue, newValue)) {
      /**
       * 触发更新， 设置值的时候，通知收集的依赖，重新执行
       * 先 set 然后再通知
       */
      trigger(target, key)
    }

    const newLength = targetIsArray ? newValue.length : 0
    // key 不是 length ，并且是数组，并且老的 length 和新的 length 不一样
    // key 等于 length，就走上面的 hasChanged 逻辑
    console.log('key', key)
    if (targetIsArray && oldLength !== newLength && key !== 'length') {
      console.log('隐式更新 length')
      trigger(target, 'length')
    }

    return res
  },
}
