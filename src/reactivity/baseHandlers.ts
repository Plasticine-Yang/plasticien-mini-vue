import { track, trigger } from './effect';
import { isReactiveSymbol, isReadonlySymbol } from './reactive';

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);

function createGetter(isReadonly = false) {
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
