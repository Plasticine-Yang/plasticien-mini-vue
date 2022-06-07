import { ref, h } from '../../lib/plasticine-mini-vue.esm.js';

const prevChildren = 'text children';
const nextChildren = [h('p', {}, 'children1'), h('p', {}, 'children2')];

export const TextToArray = {
  name: 'TextToArray',
  setup() {
    const toggleTextToArray = ref(true);
    window.toggleTextToArray = toggleTextToArray;

    return {
      toggleTextToArray,
    };
  },
  render() {
    return this.toggleTextToArray
      ? h('div', {}, prevChildren)
      : h('div', {}, nextChildren);
  },
};
