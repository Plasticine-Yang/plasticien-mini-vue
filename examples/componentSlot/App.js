import { h } from '../../lib/plasticine-mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  name: 'App',
  setup() {
    return {};
  },
  render() {
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => h('p', {}, 'header' + age),
        footer: () => h('p', {}, 'footer'),
      }
    );

    // const foo = h(Foo, {}, h('p', {}, 'default slot'));

    return h('div', {}, [foo]);
  },
};
