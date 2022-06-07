export const EMPTY_OBJ = {};

/**
 * @description 合并对象
 */
export const extend = Object.assign;

export const isObject = (val) => val !== null && typeof val === 'object';

export const hasChanged = (value, oldValue) => !Object.is(value, oldValue);

export const hasOwn = (target, key) =>
  Object.prototype.hasOwnProperty.call(target, key);
