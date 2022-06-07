import { h } from '../../lib/plasticine-mini-vue.esm.js';
import { ArrayToText } from './ArrayToText.js';
import { TextToArray } from './TextToArray.js';
import { TextToText } from './TextToText.js';

export const App = {
  name: 'App',
  setup() {},
  render() {
    return h('div', { id: 'root' }, [
      // h(ArrayToText),
      // h(TextToText),
      h(TextToArray),
    ]);
  },
};
