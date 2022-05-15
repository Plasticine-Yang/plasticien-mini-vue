class ReactiveEffect {
  private _fn: any;

  constructor(fn) {
    this._fn = fn;
  }

  run() {
    activeEffect = this; // run 被调用时将当前 effect 对象标记为激活状态
    this._fn();
  }
}

/**
 * @description 依赖收集
 * @param target 对象
 * @param key 属性名
 */
const targetMap = new Map(); // target -> key 的映射
export function track(target, key) {
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

  // 依赖收集 -- 将当前激活的 fn 加入到 dep 中
  dep.add(activeEffect);
}

/**
 * @description 触发依赖
 */
export function trigger(target, key) {
  // 根据 target 拿到 targetMap 对应的 depMaps 再根据 key 拿到 dep Set 后遍历执行依赖函数
  const depMaps = targetMap.get(target);
  const dep = depMaps.get(key);

  for (const effect of dep) {
    effect.run();
  }
}

let activeEffect; // 标记当前激活的 ReactiveEffect 对象
export function effect(fn) {
  const _effect = new ReactiveEffect(fn);

  _effect.run();
}
