export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
  };

  return component;
}

export function setupComponent(instance) {
  // TODO
  // initProps()
  // initSlots()

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  const { setup } = Component;

  // ctx -- context
  instance.proxy = new Proxy(
    {},
    {
      get(target, key) {
        const { setupState } = instance;
        if (key in setupState) {
          return setupState[key];
        }
      },
    }
  );

  if (setup) {
    const setupResult = setup();

    // setupResult 可能是 function 也可能是 object
    // - function 则将其作为组件的 render 函数
    // - object 则注入到组件的上下文中
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult: any) {
  // TODO 处理 setupResult 是 function 的情况
  if (typeof setupResult === 'object') {
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;

  instance.render = Component.render;
}
