import { patchClass } from './modules/patchClass'

/**
 * 1. class
 * 2. style
 * 3. event
 * 4. attr
 */
export function patchProp(el, key, prevValue, nextValue) {
  console.log('el', el)
  console.log('key', key)
  console.log('prevValue', prevValue)
  console.log('nextValue', nextValue)

  if (key === 'class') {
    patchClass(el, nextValue)
  }
}
