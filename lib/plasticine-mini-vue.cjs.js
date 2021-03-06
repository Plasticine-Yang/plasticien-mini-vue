'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
        key: props?.key,
        component: null,
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

const EMPTY_OBJ = {};
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
    $props: (i) => i.props,
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
        update: null,
        next: null,
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

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextVNode) {
        if (prevProps[key] !== nextProps[key]) {
            return true;
        }
    }
    return false;
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

// 微任务队列
const queue = [];
let isFlushPending = false;
const resolvedPromise = Promise.resolve();
function nextTick(fn) {
    return fn ? resolvedPromise.then(fn) : resolvedPromise;
}
function queueJob(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
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
                if (shapeFlag & 1 /* ELEMENT */) {
                    // 真实 DOM
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 处理 component 类型
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // n1 不存在表示是首次挂载，应当执行初始化的逻辑
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
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
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            // 新 children 是 text 类型
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // 旧 children 是 array 类型 -- 从 array 变为 text
                // 卸载 array 的内容
                unmountChildren(n1.children);
                // 挂载 text 的内容
                hostSetElementText(container, c2);
            }
            else {
                // 旧 children 是 text 类型 -- 从 text 变为 text
                hostSetElementText(container, c2); // 直接修改文本内容即可
            }
        }
        else {
            // 新 children 是 array 类型
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                // 旧 children 是 text 类型 -- 从 text 变为 array
                // 清空旧结点中的文本内容
                hostSetElementText(container, '');
                // 挂载新结点中 array 的内容
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // 旧 children 是 array 类型 -- 从 array 变为 acontainer, parentComponentrray
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0; // 从左端开始遍历新旧 children
        const l2 = c2.length;
        let e1 = c1.length - 1; // 指向旧 children 的末尾
        let e2 = l2 - 1; // 指向新 children 的末尾
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
            }
            else {
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
            }
            else {
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
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 旧的比新的多 -- 删除结点
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            // s1 和 s2 指向新旧 children 左端第一个不相同位置
            let s1 = i;
            let s2 = i;
            // 统计已打补丁的节点数
            let patched = 0;
            // 约束最多能给几个结点打补丁
            const toBePatched = e2 - s2 + 1;
            // 用于判断新的一组子节点是否发生了位置上的变化
            let moved = false;
            // 用于在寻找 newIndex 的过程中记录已找到的最大 newIndex
            // 当遇到比已找到的最大 newIndex 小的 newIndex 时说明结点发生了移动
            let maxNewIndexSoFar = 0;
            // 遍历新 children 建立 key 到 index 的映射
            // 便于在旧 children 中进行查找
            const keyToNewIndexMap = new Map();
            // 初始化 keyToNewIndexMap
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 初始化 newIndexToOldIndexMap 由于只需要处理 toBePatched 个元素
            // 所以使用定长数组的方式实现映射会更合适且性能更好
            const newIndexToOldIndexMap = new Array(toBePatched);
            // 初始化为 0 表示还未找到对应元素在原 children 中的索引
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            // 遍历旧 children 判断结点是否也在新 children 中
            // 在的话就找出在新 children 中的索引 -- newIndex
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // base case: 判断 patched 是否已经达到最大需要打补丁数量 是的话后续结点直接移除，不需要打补丁
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    // 后续的打补丁操作不用继续了 直接进入下一层循环将后续旧结点删除
                    continue;
                }
                let newIndex;
                // prevChild.key != null 包括了对 null 和 undefined 的判断
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 用户未给结点设置 key 属性 -- 通过 isSameVNodeType 判断结点是否相同
                    for (let j = s2; j <= e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    console.log('remove element: ', prevChild.el);
                    // newIndex 不存在说明 prevChild 在新 children 中已经消失 应当移除对应元素
                    hostRemove(prevChild.el);
                }
                else {
                    // 找到了 newIndex -- 更新 maxNewIndexSoFar，用于确定 moved 的状态
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        // 出现了 newIndex 比已找到的最大 newIndex 小的，说明发生了移动
                        moved = true;
                    }
                    // 建立 newIndex 到 oldIndex 的映射
                    // 减去 s2 是因为我们要让映射的下标从 0 开始计算
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 存在则进行打补丁 递归更新 prevChild 的 children
                    // 由于不涉及新增 所以不需要传入锚点 anchor
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 获取 newIndexToOldIndexMap 的最长递增子序列
            // 如果没有发生移动则不需要调用最长递增子序列算法
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            // j 用于遍历最长递增子序列
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                // 必要时才需要锚点，如果超出下标索引的话就意味着在最后插入元素
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    console.log('add element: ', nextChild);
                    // newIndexToOldIndexMap 中仍然存在 0 的话意味着它是新增元素
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    // 只有在需要移动的时候才进行移动
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 当 j < 0 的时候说明最长递增子序列已经遍历完了
                        // 那么接下来如果遇到要打补丁的元素都肯定是要修改位置的了
                        // 将元素插入到锚点前面
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
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
    function mountElement(vnode, container, parentComponent, anchor) {
        // 将创建的元素挂载到 vnode 上 从而让组件实例能够访问到
        const el = (vnode.el = hostCreateElement(vnode.type));
        const { children, shapeFlag } = vnode;
        // children
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(children, el, parentComponent, anchor);
        }
        // props
        const { props } = vnode;
        for (const [key, value] of Object.entries(props)) {
            hostPatchProp(el, key, null, value);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // 没有旧组件 -- 挂载组件
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            // 有旧组件 -- 更新组件
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        debugger;
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            // 即使不需要更新 也要修改 n2.el = n1.el，因为它们仍然是同一个 vnode
            n2.el = n1.el;
            // 让 n2 成为下一次组件更新时的旧 vnode
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 根据 vnode 创建组件实例
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        // setup 组件实例
        setupComponent(instance);
        setupRenderEffect(instance, container, anchor);
    }
    function setupRenderEffect(instance, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                // 首次挂载组件
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
            }
            else {
                // 组件更新
                const { proxy, vnode, next } = instance;
                if (next) {
                    // 让新 vnode.el 指向旧 vnode.el，因为它们仍然是同一个 vnode
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const subTree = instance.render.call(proxy); // 新 vnode
                const prevSubTree = instance.subTree; // 旧 vnode
                instance.subTree = subTree; // 新的 vnode 要更新到组件实例的 subTree 属性 作为下一更新的旧 vnode
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                // 将渲染推迟到微任务队列中执行
                queueJob(instance.update);
            },
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevValue, nextValue) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    // 处理事件监听
    if (isOn(key)) {
        el.addEventListener(key.slice(2).toLowerCase(), nextValue);
    }
    else {
        if (nextValue === undefined || nextValue === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
/**
 * @description 移除子元素
 * @param child 子元素
 */
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.computed = computed;
exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.nextTick = nextTick;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.readonly = readonly;
exports.ref = ref;
exports.renderSlots = renderSlots;
exports.shallowReadonly = shallowReadonly;
exports.stop = stop;
exports.unref = unref;
