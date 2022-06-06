const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
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
    // 组件 + children 是 object
    if (vnode.shapeFlag & 2 /* STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

/**
 * @description 合并对象
 */
const extend = Object.assign;
const isObject = (val) => val !== null && typeof val === 'object';
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target, key);

const targetMap = new Map(); // target -> key 的映射
let activeEffect; // 标记当前激活的 ReactiveEffect 对象
let shouldTrack; // 是否应当收集依赖
class ReactiveEffect {
    constructor(fn) {
        this.active = true;
        this.deps = [];
        this._fn = fn;
    }
    run() {
        if (!this.active) {
            // 已经被 stop 能来到这里都是手动执行 runner 才会进来的
            return this._fn();
        }
        // 处于 active 状态
        shouldTrack = true; // 打开 track 开关
        activeEffect = this; // run 被调用时将当前 effect 对象标记为激活状态
        const result = this._fn();
        // reset -- 将 shouldTrack 关闭
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            // execute onStop callback
            this.onStop && this.onStop();
            this.active = false;
        }
    }
}
/**
 * @description 清空 deps -- deps 可以在依赖收集的时候反向收集进来
 * @param effect ReactiveEffect 对象
 */
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => dep.delete(effect));
    // deps 中所有的 dep 清空后，deps 数组中没必要存储空的 dep Set 对象了
    effect.deps.length = 0;
}
/**
 * @description 依赖收集
 * @param target 对象
 * @param key 属性名
 */
function track(target, key) {
    // 不是被 track 的状态则不需要进行依赖收集
    if (!isTracking())
        return;
    // target -> key -> deps
    let depMaps = targetMap.get(target); // key -> deps 的映射
    if (!depMaps) {
        // 不存在时需要初始化
        depMaps = new Map();
        targetMap.set(target, depMaps);
    }
    let dep = depMaps.get(key);
    if (!dep) {
        dep = new Set(); // dep 存放 target.key 的所有依赖函数
        depMaps.set(key, dep);
    }
    trackEffects(dep);
}
/**
 * @description   依赖收集 -- 将当前激活的 fn 加入到 dep 中
 * @param dep 依赖集合 Set 对象
 */
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return; // 已经在 dep 中则无需再 add
    dep.add(activeEffect);
    // 反向收集 effect 给 dep
    activeEffect.deps.push(dep);
}
/**
 * @description 当前副作用函数 effect 对象是否处于被 track 状态
 */
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
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
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect; // 挂载 effect 对象到 runner 上方便访问
    // return a function --> runner
    return runner;
}
function stop(runner) {
    // 要从 runner 中拿到 effect 对象
    runner.effect.stop();
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
        if (!isReadonly) {
            track(target, key);
        }
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
function isReactive(value) {
    return !!value[isReactiveSymbol];
}
function isReadonly(value) {
    return !!value[isReadonlySymbol];
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
function createActiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target: ${raw} must be an object`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
/**
 * @description 新值是对象类型的时候转成 reactive 对象
 * @param value 新值
 */
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // 对象类型需要转成 reactive 对象
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newVal) {
        // same value should not trigger
        if (hasChanged(newVal, this._rawValue)) {
            this._rawValue = newVal;
            this._value = convert(newVal);
            triggerEffects(this.dep);
        }
    }
}
function isRef(r) {
    return !!(r && r.__v_isRef === true);
}
function unref(r) {
    return isRef(r) ? r.value : r;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // 无论属性是否是 ref 对象 只要调用 unref 就可以保证返回的是用户想要的值
            return unref(Reflect.get(target, key));
        },
        set(target, key, newVal) {
            const oldVal = target[key];
            if (isRef(oldVal) && !isRef(newVal)) {
                oldVal.value = newVal;
                return true;
            }
            else {
                return Reflect.set(target, key, newVal);
            }
        },
    });
}
function ref(value) {
    return new RefImpl(value);
}

class ComputedRefImpl {
    constructor(getter) {
        // 控制是否需要重新计算
        this._dirty = true;
        this._getter = getter;
        this._effect = new ReactiveEffect(getter);
        this._effect.scheduler = () => {
            if (!this._dirty) {
                this._dirty = true;
            }
        };
    }
    get value() {
        if (this._dirty) {
            this._dirty = false;
            this._value = this._effect.run();
        }
        return this._value;
    }
}
function computed(getter) {
    return new ComputedRefImpl(getter);
}

function emit(instance, event, ...args) {
    console.log('emit', event);
    const { props } = instance;
    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    const camelize = (str) => {
        return str.replace(/-(\w)/g, (_, s) => {
            return s ? s.toUpperCase() : '';
        });
    };
    const toHandlerKey = (str) => {
        return str ? 'on' + capitalize(camelize(str)) : '';
    };
    const handlerKey = toHandlerKey(event);
    const handler = props[handlerKey];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps ?? {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
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

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const [key, value] of Object.entries(children)) {
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    console.log('createComponentInstance -- parent: ', parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        emit: () => { },
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
    };
    component.emit = emit;
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    // ctx -- context
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit.bind(null, instance),
        });
        setCurrentInstance(null);
        // setupResult 可能是 function 也可能是 object
        // - function 则将其作为组件的 render 函数
        // - object 则注入到组件的上下文中
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // TODO 处理 setupResult 是 function 的情况
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent?.provides;
        if (provides === parentProvides) {
            // 让当前组件实例的 provides 指向一个空对象 并且该空对象以父组件的 provides 为原型
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (!(key in parentProvides)) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
        return parentProvides[key];
    }
}

function createAppAPI(render) {
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

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, } = options;
    function render(vnode, container) {
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
                if (shapeFlag & 1 /* ELEMENT */) {
                    // 真实 DOM
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 处理 component 类型
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            // n1 不存在表示是首次挂载，应当执行初始化的逻辑
            mountElement(n2, container, parentComponent);
        }
        else {
            // n1 存在表示更新 调用 patchElement 执行更新的逻辑
            patchElement(n1, n2);
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
    function mountElement(vnode, container, parentComponent) {
        // 将创建的元素挂载到 vnode 上 从而让组件实例能够访问到
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, shapeFlag } = vnode;
        // children
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(children, el, parentComponent);
        }
        // props
        const { props } = vnode;
        for (const [key, value] of Object.entries(props)) {
            hostPatchProp(el, key, value);
        }
        hostInsert(el, container);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent);
        });
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVNode, container, parentComponent) {
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
            }
            else {
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

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, value) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    // 处理事件监听
    if (isOn(key)) {
        el.addEventListener(key.slice(2).toLowerCase(), value);
    }
    else {
        el.setAttribute(key, value);
    }
}
function insert(el, container) {
    container.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { computed, createApp, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, provide, proxyRefs, reactive, readonly, ref, renderSlots, shallowReadonly, stop, unref };
