import { effect } from '../reactivity';
import { EMPTY_OBJ } from '../shared';
import { ShapeFlags } from '../shared/shapeFlags';
import { createComponentInstance, setupComponent } from './component';
import { createAppAPI } from './createApp';
import { Fragment, Text } from './vnode';

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
  } = options;

  function render(vnode: any, container: any) {
    // 调用 patch
    patch(null, vnode, container, null, null);
  }

  /**
   * @description 能够处理 component 类型和 dom element 类型
   *
   * component 类型会递归调用 patch 继续处理
   * element 类型则会进行渲染
   */
  function patch(n1, n2, container, parentComponent = null, anchor) {
    const { type, shapeFlag } = n2;

    switch (type) {
      case Fragment:
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 真实 DOM
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理 component 类型
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processText(n1, n2: any, container: any) {
    const { children } = n2;
    const textNode = (n2.el = document.createTextNode(children));
    container.append(textNode);
  }

  function processFragment(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processElement(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    if (!n1) {
      // n1 不存在表示是首次挂载，应当执行初始化的逻辑
      mountElement(n2, container, parentComponent, anchor);
    } else {
      console.log('--------------- 更新Element ---------------');
      console.log('旧vnode', n1);
      console.log('新vnode', n2);
      // n1 存在表示更新 调用 patchElement 执行更新的逻辑
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  /**
   * @description 对比 n1 和 n2 虚拟结点 找出不同的部分进行更新
   * @param n1 旧结点
   * @param n2 新结点
   * @param container 容器
   */
  function patchElement(n1, n2, container, parentComponent, anchor) {
    const el = (n2.el = n1.el);
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;

    // 找出 children 的不同
    patchChildren(n1, n2, el, parentComponent, anchor);

    // 找出 props 的不同
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(n1, n2, container, parentComponent, anchor) {
    // n2 的 children 是 text 类型
    const prevShapeFlag = n1.shapeFlag;
    const { shapeFlag } = n2;
    const c1 = n1 && n1.children;
    const c2 = n2.children;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新 children 是 text 类型
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 旧 children 是 array 类型 -- 从 array 变为 text

        // 卸载 array 的内容
        unmountChildren(n1.children);

        // 挂载 text 的内容
        hostSetElementText(container, c2);
      } else {
        // 旧 children 是 text 类型 -- 从 text 变为 text
        hostSetElementText(container, c2); // 直接修改文本内容即可
      }
    } else {
      // 新 children 是 array 类型
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 旧 children 是 text 类型 -- 从 text 变为 array

        // 清空旧结点中的文本内容
        hostSetElementText(container, '');

        // 挂载新结点中 array 的内容
        mountChildren(c2, container, parentComponent, anchor);
      } else {
        // 旧 children 是 array 类型 -- 从 array 变为 acontainer, parentComponentrray
        patchKeyedChildren(c1, c2, container, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(
    c1,
    c2,
    container,
    parentComponent,
    parentAnchor
  ) {
    let i = 0; // 从左端开始遍历新旧 children
    let e1 = c1.length - 1; // 指向旧 children 的末尾
    let e2 = c2.length - 1; // 指向新 children 的末尾

    /**
     * @description 判断两个结点是否是相同结点
     * @param n1 vnode1
     * @param n2 vnode2
     * @returns 结点是否是同一个结点
     */
    const isSameVNodeType = (n1, n2) => {
      return n1.type === n2.type && n1.key === n2.key;
    };

    // 左端对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];

      if (isSameVNodeType(n1, n2)) {
        // 新旧结点是同一个结点 -- 递归处理它们的 children 看看是否有变化
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        // 遇到不相同的结点 -- 左端对比结束
        break;
      }

      i++;
    }

    // 右端对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];

      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }

      e1--;
      e2--;
    }

    if (i > e1) {
      // 新的比旧的多 -- 创建结点
      if (i <= e2) {
        // 确定插入位置
        const nextPos = e2 + 1;
        // 确定锚点 -- 在锚点之前插入新增结点
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 旧的比新的多 -- 删除结点
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++;
      }
    }

    console.log(`i: ${i}, e1: ${e1}, e2: ${e2}`);
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      // 获取到 vnode 中的 el
      const el = children[i].el;
      // 调用自定义渲染器中的 remove 逻辑
      hostRemove(el);
    }
  }

  /**
   * @description 对比新旧结点的 props 进行更新
   * @param n1 旧结点
   * @param n2 新结点
   */
  function patchProps(el, oldProps, newProps) {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        const next = newProps[key];
        const prev = oldProps[key];

        if (next !== prev) {
          hostPatchProp(el, key, prev, next);
        }
      }

      // 遍历 oldProps 找出不存在于 newProps 中的 key 进行删除
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null);
          }
        }
      }
    }
  }

  function mountElement(vnode: any, container: any, parentComponent, anchor) {
    // 将创建的元素挂载到 vnode 上 从而让组件实例能够访问到
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { children, shapeFlag } = vnode;

    // children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent, anchor);
    }

    // props
    const { props } = vnode;
    for (const [key, value] of Object.entries(props)) {
      hostPatchProp(el, key, null, value);
    }

    hostInsert(el, container, anchor);
  }

  function mountChildren(
    children: any,
    container: any,
    parentComponent,
    anchor
  ) {
    children.forEach((v) => {
      patch(null, v, container, parentComponent, anchor);
    });
  }

  function processComponent(
    n1,
    n2: any,
    container: any,
    parentComponent,
    anchor
  ) {
    mountComponent(n2, container, parentComponent, anchor);
  }

  function mountComponent(
    initialVNode: any,
    container,
    parentComponent,
    anchor
  ) {
    // 根据 vnode 创建组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);

    // setup 组件实例
    setupComponent(instance);
    setupRenderEffect(instance, container, anchor);
  }

  function setupRenderEffect(instance, container, anchor) {
    effect(() => {
      if (!instance.isMounted) {
        const { proxy, vnode } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));

        // subTree 可能是 Component 类型也可能是 Element 类型
        // 调用 patch 去处理 subTree
        // Element 类型则直接挂载
        // 初次挂载 n1 不存在
        patch(null, subTree, container, instance, anchor);

        // subTree vnode 经过 patch 后就变成了真实的 DOM 此时 subTree.el 指向了根 DOM 元素
        // 将 subTree.el 赋值给 vnode.el 就可以在组件实例上访问到挂载的根 DOM 元素对象了
        vnode.el = subTree.el;
        instance.isMounted = true; // 初始化后及时将其标记为已挂载
      } else {
        const { proxy, vnode } = instance;
        const subTree = instance.render.call(proxy); // 新 vnode
        const prevSubTree = instance.subTree; // 旧 vnode
        instance.subTree = subTree; // 新的 vnode 要更新到组件实例的 subTree 属性 作为下一更新的旧 vnode

        patch(prevSubTree, subTree, container, instance, anchor);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
