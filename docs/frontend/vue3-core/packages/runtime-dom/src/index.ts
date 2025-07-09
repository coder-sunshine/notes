import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'
import { createRenderer } from '@vue/runtime-core'

export * from '@vue/runtime-core'

const renderOptions = { patchProp, ...nodeOps }

// 创建渲染器，根据传入的 renderOptions参数，
const renderer = createRenderer(renderOptions)

export function render(vnode, container) {
  // 调用渲染器的 render 方法，将 vnode 渲染到 container 中
  renderer.render(vnode, container)
}

export { renderOptions }
