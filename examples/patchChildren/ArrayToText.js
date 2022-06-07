import { h, ref } from '../../lib/plasticine-mini-vue.esm.js';

const prevChildren = [h('p', {}, 'foo'), h('p', {}, 'bar')];
const nextChildren = 'text children';

export const ArrayToText = {
  name: 'ArrayToText',
  setup() {
    const toggleChildren = ref(true);
    window.toggleChildren = toggleChildren;

    return {
      toggleChildren,
    };
  },
  render() {
    return this.toggleChildren
      ? h('div', {}, prevChildren)
      : h('div', {}, nextChildren);
  },
};
