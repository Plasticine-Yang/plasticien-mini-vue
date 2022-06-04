import { createRenderer } from '../runtime-core';

function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, value) {
  const isOn = (key: string) => /^on[A-Z]/.test(key);
  // 处理事件监听
  if (isOn(key)) {
    el.addEventListener(key.slice(2).toLowerCase(), value);
  } else {
    el.setAttribute(key, value);
  }
}

function insert(el, container) {
  container.append(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
});

export function createApp(...args) {
  return renderer.createApp(...args);
}

export * from '../runtime-core';
