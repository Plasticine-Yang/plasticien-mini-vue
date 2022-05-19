import { reactive } from '../reactive';
import { effect, stop } from '../effect';

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

  it('should return runner when call effect', () => {
    let foo = 10;

    const runner = effect(() => {
      foo++;
      return 'foo';
    });

    expect(foo).toBe(11);
    const res = runner(); // runner will return the return value of effect wrapper fn
    expect(foo).toBe(12);
    expect(res).toBe('foo');
  });

  it('scheduler', () => {
    // 1. effect 接收第二个 options 参数 其中包含 scheduler
    // 2. effect 首次执行时会执行 fn
    // 3. 当响应式对象 set 时不会执行 fn 而是执行 scheduler
    // 4. 执行 runner 的时候仍然能够执行 fn

    let dummy;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });

    const foo = reactive({ bar: 1 });
    const runner = effect(
      () => {
        dummy = foo.bar;
      },
      { scheduler }
    );

    // scheduler should not be called on first run effect
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // scheduler should be called on first trigger
    foo.bar++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // effect fn should not run yet
    expect(dummy).toBe(1);
    // manually run
    run();
    // effect fn should have run
    expect(dummy).toBe(2);
  });

  it('stop', () => {
    // 将 dep 中的依赖清空
    let dummy;
    const foo = reactive({ bar: 1 });
    const runner = effect(() => {
      dummy = foo.bar;
    });

    foo.bar = 2;
    expect(dummy).toBe(2);

    // stop effect
    stop(runner);

    // foo.bar = 3;
    foo.bar++;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });

  it('onStop', () => {
    const onStop = jest.fn();
    const foo = reactive({ bar: 1 });
    let dummy;

    const runner = effect(
      () => {
        dummy = foo.bar;
      },
      { onStop }
    );

    stop(runner);
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
