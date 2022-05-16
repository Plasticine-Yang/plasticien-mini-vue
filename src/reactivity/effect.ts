class ReactiveEffect {
  private _fn: any;
  private active = true;
  deps = [];
  onStop: any;

  constructor(fn, public scheduler?) {
    this._fn = fn;
  }

  run() {
    activeEffect = this; // run 被调用时将当前 effect 对象标记为激活状态

    // return value of _fn
    return this._fn();
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

  if (!activeEffect) return;

  // 依赖收集 -- 将当前激活的 fn 加入到 dep 中
  dep.add(activeEffect);
  // 反向收集 effect 给 dep
  activeEffect.deps.push(dep);
}

/**
 * @description 触发依赖
 */
export function trigger(target, key) {
  // 根据 target 拿到 targetMap 对应的 depMaps 再根据 key 拿到 dep Set 后遍历执行依赖函数
  const depMaps = targetMap.get(target);
  const dep = depMaps.get(key);

  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

let activeEffect; // 标记当前激活的 ReactiveEffect 对象
export function effect(fn, options: any = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);
  _effect.onStop = options.onStop;

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
