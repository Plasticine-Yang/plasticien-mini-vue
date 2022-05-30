import { h, renderSlots } from '../../lib/plasticine-mini-vue.esm.js';

export const Foo = {
  name: 'Foo',
  setup() {
    return {};
  },
  render() {
    const foo = h('p', {}, 'foo');
    const age = 20;
    return h('div', {}, [
      renderSlots(this.$slots, 'header', { age }),
      foo,
      renderSlots(this.$slots, 'footer'),
    ]);
  },
};
