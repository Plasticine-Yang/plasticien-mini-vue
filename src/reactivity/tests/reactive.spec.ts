import { reactive } from '../reactive';

describe('reactive', () => {
  it('happy path', () => {
    const originial = { foo: 1 };
    const observed = reactive(originial);

    // observed 和 original 应当是两个不同的对象
    expect(observed).not.toBe(originial);
    expect(observed.foo).toBe(1);
  });
});
