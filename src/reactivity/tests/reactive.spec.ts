import { isReactive, reactive } from '../reactive';

describe('reactive', () => {
  it('happy path', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    // observed 和 original 应当是两个不同的对象
    expect(observed).not.toBe(original);
    expect(observed.foo).toBe(1);

    // isReactive
    expect(isReactive(observed)).toBe(true);
    expect(isReactive(original)).toBe(false);
  });
});
