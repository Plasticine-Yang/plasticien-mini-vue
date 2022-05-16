import { readonly } from '../reactive';

describe('readonly', () => {
  it('happy path', () => {
    const foo = { bar: 1 };
    const observed = readonly(foo);

    expect(observed).not.toBe(foo);
    expect(observed.bar).toBe(1);
  });

  it('warn when call set', () => {
    // received value must be a mock or spy function
    console.warn = jest.fn();

    const foo = readonly({ bar: 1 });
    foo.bar++;

    expect(console.warn).toBeCalled();
  });
});
