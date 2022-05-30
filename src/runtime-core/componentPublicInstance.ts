import { hasOwn } from '../shared';

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
};

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;
    const publicGetter = publicPropertiesMap[key];

    if (publicGetter) {
      return publicGetter(instance);
    }

    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }
  },
};
