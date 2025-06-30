export function patchClass(el, value) {
  // 如果新值没有值，则是要移除 class
  if (value == undefined) {
    el.removeAttribute('class')
  } else {
    // 如果新值有值，则设置 class
    el.className = value
  }
}
