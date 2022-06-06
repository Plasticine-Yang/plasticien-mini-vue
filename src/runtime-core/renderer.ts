import { effect } from '../reactivity';
import { ShapeFlags } from '../shared/shapeFlags';
import { createComponentInstance, setupComponent } from './component';
import { createAppAPI } from './createApp';
import { Fragment, Text } from './vnode';

export function createRenderer(options) {
  const { createElement, patchProp, insert } = options;

  function render(vnode: any, container: any) {
    // 调用 patch
    patch(null, vnode, container);
  }

  /**
   * @description 能够处理 component 类型和 dom element 类型
   *
   * component 类型会递归调用 patch 继续处理
   * element 类型则会进行渲染
   */
  function patch(n1, n2, container, parentComponent = null) {
    const { type, shapeFlag } = n2;

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 真实 DOM
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理 component 类型
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(n1, n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      // n1 不存在表示是首次挂载，应当执行初始化的逻辑
      mountElement(n2, container, parentComponent);
    } else {
      // n1 存在表示更新 调用 patchElement 执行更新的逻辑
      patchElement(n1, n2, container);
    }
  }

  /**
   * @description 对比 n1 和 n2 虚拟结点 找出不同的部分进行更新
   * @param n1 旧结点
   * @param n2 新结点
   * @param container 容器
   */
  function patchElement(n1, n2, container) {
    console.log('n1', n1);
    console.log('n2', n2);

    // 找出 props 的不同
    // 找出 children 的不同
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    // 将创建的元素挂载到 vnode 上 从而让组件实例能够访问到
    const el = (vnode.el = createElement(vnode.type));
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
      patchProp(el, key, value);
    }

    insert(el, container);
  }

  function mountChildren(children: any, container: any, parentComponent) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent);
    });
  }

  function processComponent(n1, n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent);
  }

  function mountComponent(initialVNode: any, container, parentComponent) {
    // 根据 vnode 创建组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);

    // setup 组件实例
    setupComponent(instance);
    setupRenderEffect(instance, container);
  }

  function setupRenderEffect(instance, container) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy, vnode } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));

        // subTree 可能是 Component 类型也可能是 Element 类型
        // 调用 patch 去处理 subTree
        // Element 类型则直接挂载
        // 初次挂载 n1 不存在
        patch(null, subTree, container, instance);

        // subTree vnode 经过 patch 后就变成了真实的 DOM 此时 subTree.el 指向了根 DOM 元素
        // 将 subTree.el 赋值给 vnode.el 就可以在组件实例上访问到挂载的根 DOM 元素对象了
        vnode.el = subTree.el;
        instance.isMounted = true; // 初始化后及时将其标记为已挂载
      } else {
        const { proxy, vnode } = instance;
        const subTree = instance.render.call(proxy); // 新 vnode
        const prevSubTree = instance.subTree; // 旧 vnode
        instance.subTree = subTree; // 新的 vnode 要更新到组件实例的 subTree 属性 作为下一更新的旧 vnode

        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
