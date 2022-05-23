import { render } from './renderer';
import { createVNode } from './vnode';

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      // 先将 rootComponent 转成 VNode 再进行处理
      const vnode = createVNode(rootComponent);

      render(vnode, rootContainer);
    },
  };
}
