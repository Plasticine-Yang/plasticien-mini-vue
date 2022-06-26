import { h } from '../../lib/plasticine-mini-vue.esm.js';

export const Child = {
  name: 'Child',
  setup() {},
  render() {
    return h(
      'p',
      {},
      `here is child, I receive a message from App: ${this.$props.msg}`
    );
  },
};
