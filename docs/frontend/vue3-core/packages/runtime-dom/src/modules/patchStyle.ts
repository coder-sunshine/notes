export function patchStyle(el, prevValue, nextValue) {
  const style = el.style
  console.log('prevValue', prevValue)

  console.log('nextValue', nextValue)

  // 如果新值有值，则全部设置上去
  if (nextValue) {
    for (const key in nextValue) {
      /**
       * 把新的样式全部生效，设置到 style 中
       */
      style[key] = nextValue[key]
    }
  }

  if (prevValue) {
    for (const key in prevValue) {
      if (!(key in nextValue)) {
        style[key] = null
      }
    }
  }
}
