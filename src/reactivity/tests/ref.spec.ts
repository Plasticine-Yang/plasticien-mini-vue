import { effect } from '../effect';
import { reactive } from '../reactive';
import { isRef, proxyRefs, ref, unref } from '../ref';

describe('ref', () => {
  it('should hold a value', () => {
    const a = ref(1);
    expect(a.value).toBe(1);
    a.value = 2;
    expect(a.value).toBe(2);
  });

  it('should be reactive', () => {
    const a = ref(1);
    let dummy;
    let calls = 0;
    effect(() => {
      calls++;
      dummy = a.value;
    });
    expect(calls).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
    // same value should not trigger
    a.value = 2;
    expect(calls).toBe(2);
    expect(dummy).toBe(2);
  });

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });

  it('isRef', () => {
    const a = ref(1);
    const foo = reactive({ bar: 1 });
    expect(isRef(a)).toBe(true);
    expect(isRef(1)).toBe(false);
    expect(isRef(foo)).toBe(false);
  });

  it('unref', () => {
    expect(unref(1)).toBe(1);
    expect(unref(ref(1))).toBe(1);
  });

  it('proxyRefs', () => {
    const foo = {
      name: 'foo',
      age: ref(20),
    };
    const proxyFoo = proxyRefs(foo);
    expect(foo.age.value).toBe(20);
    expect(proxyFoo.name).toBe('foo');
    expect(proxyFoo.age).toBe(20);

    proxyFoo.age = 21;
    expect(proxyFoo.age).toBe(21);
    expect(foo.age.value).toBe(21);

    proxyFoo.age = ref(22);
    expect(proxyFoo.age).toBe(22);
    expect(foo.age.value).toBe(22);
  });
});
