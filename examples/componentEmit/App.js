import { h } from '../../lib/plasticine-mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  setup() {
    return {};
  },
  render() {
    const onAdd = (a, b) => {
      console.log('onAdd', a, b);
    };
    const onAddValue = () => {
      console.log('onAddValue');
    };

    return h('div', {}, [h(Foo, { onAdd, onAddValue })]);
  },
};
