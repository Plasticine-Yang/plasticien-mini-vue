import { extend, isObject } from '../shared';
import { track, trigger } from './effect';
import {
  isReactiveSymbol,
  isReadonlySymbol,
  reactive,
  readonly,
} from './reactive';

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key) {
    // isReactive
    if (key === isReactiveSymbol) {
      return !isReadonly;
    } else if (key === isReadonlySymbol) {
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

export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(
      `cannot set ${target}.${key} to ${value}, because it's readonly`
    );
    return true;
  },
};

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});
