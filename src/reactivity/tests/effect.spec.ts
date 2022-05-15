import { reactive } from '../reactive';
import { effect } from '../effect';

describe('effect', () => {
  // it 和 test 是一样的
  // it.skip 表示暂时跳过该测试项 因为目前需要 reactive 和 effect 而我们希望先去实现 reactive
  // 但又不希望 effect.spec.ts 影响整个测试的进行 因此可以用 skip 暂时跳过 等 reactive 实现后再改回来
  it('happy path', () => {
    const foo = reactive({
      name: 'foo',
      age: 20,
      isMale: true,
      friends: ['Mike', 'Tom', 'Bob'],
      info: {
        address: 'China',
        phone: 11011011000,
      },
    });

    let nextAge;
    effect(() => (nextAge = foo.age + 1));

    expect(nextAge).toBe(21);

    // update
    foo.age++;
    expect(nextAge).toBe(22);
  });
});
