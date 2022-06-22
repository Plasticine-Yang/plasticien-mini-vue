import { h } from '../../lib/plasticine-mini-vue.esm.js';
import {
  ArrayToArrayCase1,
  ArrayToArrayCase2,
  ArrayToArrayCase3,
  ArrayToArrayCase4,
  ArrayToArrayCase5,
  ArrayToArrayCase6,
} from './ArrayToArray.js';
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
      // h(TextToArray),
      // h(ArrayToArrayCase1),
      // h(ArrayToArrayCase2),
      // h(ArrayToArrayCase3),
      // h(ArrayToArrayCase4),
      // h(ArrayToArrayCase5),
      h(ArrayToArrayCase6),
    ]);
  },
};