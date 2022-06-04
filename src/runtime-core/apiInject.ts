import { getCurrentInstance } from './component';

export function provide(key, value) {
  const currentInstance: any = getCurrentInstance();

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

export function inject(key, defaultValue) {
  const currentInstance: any = getCurrentInstance();

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
