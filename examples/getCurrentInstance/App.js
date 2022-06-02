import { getCurrentInstance, h } from '../../lib/plasticine-mini-vue.esm.js';
import { Foo } from './Foo.js';

export const App = {
  name: 'App',
  setup() {
    const currentInstance = getCurrentInstance();
    console.log('App: ', currentInstance);
  },
  render() {
    return h('div', {}, [h('div', {}, 'App'), h(Foo)]);
  },
};
