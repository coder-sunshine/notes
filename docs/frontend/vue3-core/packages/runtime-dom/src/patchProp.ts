import { isOn } from '@vue/shared'
import { patchClass } from './modules/patchClass'
import { patchStyle } from './modules/patchStyle'
import { patchEvent } from './modules/patchEvent'

/**
 * 1. class
 * 2. style
 * 3. event
 * 4. attr
 */
export function patchProp(el, key, prevValue, nextValue) {
  if (key === 'class') {
    patchClass(el, nextValue)
  }

  if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  }

  if (isOn(key)) {
    patchEvent(el, key, prevValue, nextValue)
  }
}
