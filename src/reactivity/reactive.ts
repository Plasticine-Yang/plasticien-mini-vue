import { isObject } from '../shared';
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from './baseHandlers';

// ReactiveFlags
export const isReactiveSymbol = Symbol();
export const isReadonlySymbol = Symbol();

export function reactive(raw) {
  return createActiveObject(raw, mutableHandlers);
}

export function readonly(raw) {
  return createActiveObject(raw, readonlyHandlers);
}

export function shallowReadonly(raw) {
  return createActiveObject(raw, shallowReadonlyHandlers);
}

export function isReactive(value) {
  return !!value[isReactiveSymbol];
}

export function isReadonly(value) {
  return !!value[isReadonlySymbol];
}

export function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}

function createActiveObject(raw: any, baseHandlers) {
  if (!isObject(raw)) {
    console.warn(`target: ${raw} must be an object`);
    return raw;
  }
  return new Proxy(raw, baseHandlers);
}
