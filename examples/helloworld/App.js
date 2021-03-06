import { h } from '../../lib/plasticine-mini-vue.esm.js';
import { Foo } from './Foo.js';

window.self = null;
export const App = {
  // 由于还没有实现模板编译的功能 因此先用 render 函数来替代
  render() {
    window.self = this;
    return h(
      'div',
      {
        class: ['cyan', 'success'],
        onClick() {
          console.log('click...');
        },
        onMouseMove() {
          console.log('mouse moving...');
        },
      },
      [
        h('p', { class: 'cyan' }, 'hi '),
        h('p', { class: 'darkcyan' }, 'plasticine '),
        h('p', { class: 'darkviolet' }, 'mini-vue!'),
        h('p', { class: 'darkcyan' }, `setupState msg: ${this.msg}`),
        h(Foo, { count: 666 }),
      ]
    );
  },
  setup() {
    // Composition API
    return {
      msg: 'plasticine-mini-vue',
    };
  },
};
