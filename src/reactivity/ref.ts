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

export function ref(value) {
  return new RefImpl(value);
}
