import { createVNode } from './vnode';

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount(rootContainer) {
        // 先将 rootComponent 转成 VNode 再进行处理
        const vnode = createVNode(rootComponent);

        if (typeof rootContainer === 'string') {
          rootContainer = document.querySelector(rootContainer);
        }

        render(vnode, rootContainer);
      },
    };
  };
}
