import { hasChanged, isObject } from '../shared';
import { isTracking, trackEffects, triggerEffects } from './effect';
import { reactive } from './reactive';

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

/**
 * @description 新值是对象类型的时候转成 reactive 对象
 * @param value 新值
 */
function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

class RefImpl {
  private _value: any;
  private _rawValue: any;
  public dep;
  public __v_isRef = true;

  constructor(value) {
    // 对象类型需要转成 reactive 对象
    this._rawValue = value;
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    // same value should not trigger
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal;
      this._value = convert(newVal);
      triggerEffects(this.dep);
    }
  }
}

export function isRef(r) {
  return !!(r && r.__v_isRef === true);
}

export function unref(r) {
  return isRef(r) ? r.value : r;
}

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, {
    get(target, key) {
      // 无论属性是否是 ref 对象 只要调用 unref 就可以保证返回的是用户想要的值
      return unref(Reflect.get(target, key));
    },
    set(target, key, newVal) {
      const oldVal = target[key];
      if (isRef(oldVal) && !isRef(newVal)) {
        oldVal.value = newVal;
        return true;
      } else {
        return Reflect.set(target, key, newVal);
      }
    },
  });
}

export function ref(value) {
  return new RefImpl(value);
}
