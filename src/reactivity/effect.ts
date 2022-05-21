import { extend } from '../shared';

const targetMap = new Map(); // target -> key 的映射
let activeEffect; // 标记当前激活的 ReactiveEffect 对象
let shouldTrack; // 是否应当收集依赖

export class ReactiveEffect {
  private _fn: any;
  private active = true;

  deps? = [];
  scheduler?: any;
  onStop?: any;

  constructor(fn) {
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
  effect.deps.forEach((dep: any) => dep.delete(effect));

  // deps 中所有的 dep 清空后，deps 数组中没必要存储空的 dep Set 对象了
  effect.deps.length = 0;
}

/**
 * @description 依赖收集
 * @param target 对象
 * @param key 属性名
 */
export function track(target, key) {
  // 不是被 track 的状态则不需要进行依赖收集
  if (!isTracking()) return;
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
export function trackEffects(dep) {
  if (dep.has(activeEffect)) return; // 已经在 dep 中则无需再 add
  dep.add(activeEffect);
  // 反向收集 effect 给 dep
  activeEffect.deps.push(dep);
}

/**
 * @description 当前副作用函数 effect 对象是否处于被 track 状态
 */
export function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

/**
 * @description 触发依赖
 */
export function trigger(target, key) {
  // 根据 target 拿到 targetMap 对应的 depMaps 再根据 key 拿到 dep Set 后遍历执行依赖函数
  const depMaps = targetMap.get(target);
  const dep = depMaps.get(key);

  triggerEffects(dep);
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn);

  extend(_effect, options);

  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect; // 挂载 effect 对象到 runner 上方便访问

  // return a function --> runner
  return runner;
}

export function stop(runner) {
  // 要从 runner 中拿到 effect 对象
  runner.effect.stop();
}
