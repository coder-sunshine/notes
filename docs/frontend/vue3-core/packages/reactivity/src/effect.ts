// 用来保存当前正在执行的 effect
// fn 调用，那么 fn 里面的依赖就会触发相应的 get set 操作等。就可以初步建立关联关系
export let activeSub

export function effect(fn) {
  // 将 fn 保存在全局 activeSub 上，这样在触发更新的时候就可以通知当前的fn 再次执行
  activeSub = fn
  activeSub()
  // 执行完之后，将 activeSub 设置为 undefined，不然会一直 重复做 this.subs = activeSub 的操作
  activeSub = undefined
}
