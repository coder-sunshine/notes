import { h } from './h'

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const app = {
      mount(container) {
        /**
         * 根组件
         * 要挂载的容器
         */

        // 创建组件的虚拟节点
        const vnode = h(rootComponent, rootProps)

        // 将组件的虚拟节点挂载到 container 中
        render(vnode, container)
      },
    }
    return app
  }
}
