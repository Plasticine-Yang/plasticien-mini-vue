import { isProxy, isReactive, reactive } from '../reactive';

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

    // isProxy
    expect(isProxy(observed)).toBe(true);
    expect(isProxy(original)).toBe(false);
  });

  it('nested reactives', () => {
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    };
    const observed = reactive(original);
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });
});
