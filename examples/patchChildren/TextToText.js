import { ref, h } from '../../lib/plasticine-mini-vue.esm.js';

export const TextToText = {
  name: 'TextToText',
  setup() {
    const toggleTextToText = ref(true);
    window.toggleTextToText = toggleTextToText;

    return {
      toggleTextToText,
    };
  },
  render() {
    return this.toggleTextToText
      ? h('p', {}, 'old text')
      : h('p', {}, 'new text');
  },
};
