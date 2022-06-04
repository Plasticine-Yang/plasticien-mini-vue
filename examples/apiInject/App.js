import { h, provide, inject } from '../../lib/plasticine-mini-vue.esm.js';

const Foo = {
  name: 'Foo',
  setup() {
    // 提供一个和父组件 App 中提供过的同名数据 检查是否会覆盖父组件中提供的 appKey
    provide('appKey', 'fooValue');
    const appValue = inject('appKey');

    return {
      appValue,
    };
  },
  render() {
    return h('div', {}, [
      h('p', {}, 'Foo'),
      h('p', {}, `Foo inject appKey -- ${this.appValue}`),
      h(Bar),
    ]);
  },
};

const Bar = {
  name: 'Bar',
  setup() {
    const appValue = inject('appKey');
    const normalValue = inject('normalKey', 'normalValue');
    const functionValue = inject('functionKey', () => 'functionValue');

    return {
      appValue,
      normalValue,
      functionValue,
    };
  },
  render() {
    return h('div', {}, [
      h('p', {}, 'Bar'),
      h('p', {}, `Bar inject appKey -- ${this.appValue}`),
      h(
        'p',
        {},
        `Bar inject normalKey that not provide in parent -- ${this.normalValue}`
      ),
      h(
        'p',
        {},
        `Bar inject functionKey that not provide in parent -- ${this.functionValue}`
      ),
    ]);
  },
};

export const App = {
  name: 'App',
  setup() {
    provide('appKey', 'appValue');
  },
  render() {
    return h('div', {}, [h(Foo)]);
  },
};
