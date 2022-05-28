/**
 * @description 合并对象
 */
const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === 'object';
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

const targetMap = new Map(); // target -> key 的映射
/**
 * @description 触发依赖
 */
function trigger(target, key) {
    // 根据 target 拿到 targetMap 对应的 depMaps 再根据 key 拿到 dep Set 后遍历执行依赖函数
    const depMaps = targetMap.get(target);
    const dep = depMaps.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        // isReactive
        if (key === isReactiveSymbol) {
            return !isReadonly;
        }
        else if (key === isReadonlySymbol) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`cannot set ${target}.${key} to ${value}, because it's readonly`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

// ReactiveFlags
const isReactiveSymbol = Symbol();
const isReadonlySymbol = Symbol();
function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function createActiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target: ${raw} must be an object`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

function initProps(instance, rawProps) {
    instance.props = rawProps ?? {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
    },
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    // ctx -- context
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props));
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
    patch(vnode, container);
}
/**
 * @description 能够处理 component 类型和 dom element 类型
 *
 * component 类型会递归调用 patch 继续处理
 * element 类型则会进行渲染
 */
function patch(vnode, container) {
    const { type, shapeFlag } = vnode;
    if (shapeFlag & 1 /* ELEMENT */) {
        // 真实 DOM
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        // 处理 component 类型
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    // 将 DOM 对象挂载到 vnode 上 从而让组件实例能够访问到
    const el = (vnode.el = document.createElement(vnode.type));
    const { children, shapeFlag } = vnode;
    // children
    if (shapeFlag & 4 /* TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
        mountChildren(children, el);
    }
    // props
    const { props } = vnode;
    for (const [key, value] of Object.entries(props)) {
        const isOn = (key) => /^on[A-Z]/.test(key);
        // 处理事件监听
        if (isOn(key)) {
            el.addEventListener(key.slice(2).toLowerCase(), value);
        }
        else {
            el.setAttribute(key, value);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.forEach((v) => {
        patch(v, container);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    // 根据 vnode 创建组件实例
    const instance = createComponentInstance(vnode);
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
    patch(subTree, container);
    // subTree vnode 经过 patch 后就变成了真实的 DOM 此时 subTree.el 指向了根 DOM 元素
    // 将 subTree.el 赋值给 vnode.el 就可以在组件实例上访问到挂载的根 DOM 元素对象了
    vnode.el = subTree.el;
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
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    // 根据 children 的类型添加 vnode 的类型 -- 是 TEXT_CHILDREN 还是 ARRAY_CHILDREN
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
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
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
