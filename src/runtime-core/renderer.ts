import { ShapeFlags } from '../shared/shapeFlags';
import { createComponentInstance, setupComponent } from './component';
import { Fragment, Text } from './vnode';

export function render(vnode: any, container: any) {
  // 调用 patch
  patch(vnode, container);
}

/**
 * @description 能够处理 component 类型和 dom element 类型
 *
 * component 类型会递归调用 patch 继续处理
 * element 类型则会进行渲染
 */
export function patch(vnode, container, parentComponent = null) {
  const { type, shapeFlag } = vnode;

  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent);
      break;
    case Text:
      processText(vnode, container);
      break;

    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        // 真实 DOM
        processElement(vnode, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 处理 component 类型
        processComponent(vnode, container, parentComponent);
      }
      break;
  }
}

function processText(vnode: any, container: any) {
  const { children } = vnode;
  const textNode = (vnode.el = document.createTextNode(children));
  container.append(textNode);
}

function processFragment(vnode: any, container: any, parentComponent) {
  mountChildren(vnode.children, container, parentComponent);
}

function processElement(vnode: any, container: any, parentComponent) {
  mountElement(vnode, container, parentComponent);
}

function mountElement(vnode: any, container: any, parentComponent) {
  // 将 DOM 对象挂载到 vnode 上 从而让组件实例能够访问到
  const el = (vnode.el = document.createElement(vnode.type));
  const { children, shapeFlag } = vnode;

  // children
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children, el, parentComponent);
  }

  // props
  const { props } = vnode;
  for (const [key, value] of Object.entries(props)) {
    const isOn = (key: string) => /^on[A-Z]/.test(key);
    // 处理事件监听
    if (isOn(key)) {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }

  container.append(el);
}

function mountChildren(children: any, container: any, parentComponent) {
  children.forEach((v) => {
    patch(v, container, parentComponent);
  });
}

function processComponent(vnode: any, container: any, parentComponent) {
  mountComponent(vnode, container, parentComponent);
}

function mountComponent(initialVNode: any, container, parentComponent) {
  // 根据 vnode 创建组件实例
  const instance = createComponentInstance(initialVNode, parentComponent);

  // setup 组件实例
  setupComponent(instance);
  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const { proxy, vnode } = instance;
  const subTree = instance.render.call(proxy);

  // subTree 可能是 Component 类型也可能是 Element 类型
  // 调用 patch 去处理 subTree
  // Element 类型则直接挂载
  patch(subTree, container, instance);

  // subTree vnode 经过 patch 后就变成了真实的 DOM 此时 subTree.el 指向了根 DOM 元素
  // 将 subTree.el 赋值给 vnode.el 就可以在组件实例上访问到挂载的根 DOM 元素对象了
  vnode.el = subTree.el;
}
