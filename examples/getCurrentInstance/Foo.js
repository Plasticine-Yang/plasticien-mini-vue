import { getCurrentInstance, h } from '../../lib/plasticine-mini-vue.esm.js';

export const Foo = {
  name: 'Foo',
  setup() {
    const currentInstance = getCurrentInstance();
    console.log('Foo: ', currentInstance);
  },
  render() {
    return h('div', {}, 'Foo');
  },
};
