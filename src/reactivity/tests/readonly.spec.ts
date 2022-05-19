import { isReadonly, readonly } from '../reactive';

describe('readonly', () => {
  it('happy path', () => {
    const foo = { bar: 1 };
    const observed = readonly(foo);

    expect(observed).not.toBe(foo);
    expect(observed.bar).toBe(1);

    expect(isReadonly(observed)).toBe(true);
    expect(isReadonly(foo)).toBe(false);
  });

  it('warn when call set', () => {
    // received value must be a mock or spy function
    console.warn = jest.fn();

    const foo = readonly({ bar: 1 });
    foo.bar++;

    expect(console.warn).toBeCalled();
  });

  it('should make nested value readonly', () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    expect(wrapped).not.toBe(original);
    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(original.bar)).toBe(false);
  });
});
