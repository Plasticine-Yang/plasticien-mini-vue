'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        const setupResult = setup();
        // setupResult 可能是 function 也可能是 object
        // - function 则将其作为组件的 render 函数
        // - object 则注入到组件的上下文中
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO 处理 setupResult 是 function 的情况
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
    // 调用 patch
    patch(vnode);
}
/**
 * @description 能够处理 component 类型和 dom element 类型
 *
 * component 类型会递归调用 patch 继续处理
 * element 类型则会进行渲染
 */
function patch(vnode, container) {
    // 处理 component 类型
    processcomponent(vnode);
}
function processcomponent(vnode, container) {
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    // 根据 vnode 创建组件实例
    const instance = createComponentInstance(vnode);
    // setup 组件实例
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // subTree 可能是 Component 类型也可能是 Element 类型
    // 调用 patch 去处理 subTree
    // Element 类型则直接挂载
    patch(subTree);
}

/**
 * @description 创建虚拟 DOM 结点
 * @param type 组件导出的对象
 * @param props 组件的 props
 * @param children 子组件
 */
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先将 rootComponent 转成 VNode 再进行处理
            const vnode = createVNode(rootComponent);
            render(vnode);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
