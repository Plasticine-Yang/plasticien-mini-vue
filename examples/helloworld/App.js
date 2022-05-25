import { h } from '../../lib/plasticine-mini-vue.esm.js';

export const App = {
  // 由于还没有实现模板编译的功能 因此先用 render 函数来替代
  render() {
    return h(
      'div',
      {
        class: ['cyan', 'success'],
      },
      [
        h('p', { class: 'cyan' }, 'hi '),
        h('p', { class: 'darkcyan' }, 'plasticine '),
        h('p', { class: 'darkviolet' }, 'mini-vue!'),
        h('p', { class: 'darkcyan' }, `setupState msg: ${this.msg}`),
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
