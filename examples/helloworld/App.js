import { h } from '../../lib/plasticine-mini-vue.esm.js';

export const App = {
  // 由于还没有实现模板编译的功能 因此先用 render 函数来替代
  render() {
    return h('div', 'hi' + this.msg);
  },
  setup() {
    // Composition API
    return {
      msg: 'plasticine-mini-vue',
    };
  },
};