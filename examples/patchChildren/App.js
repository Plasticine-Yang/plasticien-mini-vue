import { h } from '../../lib/plasticine-mini-vue.esm.js';
import {
  ArrayToArrayCase1,
  ArrayToArrayCase10,
  ArrayToArrayCase2,
  ArrayToArrayCase3,
  ArrayToArrayCase4,
  ArrayToArrayCase5,
  ArrayToArrayCase6,
  ArrayToArrayCase7,
  ArrayToArrayCase8,
  ArrayToArrayCase9,
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
      // h(ArrayToArrayCase6),
      // h(ArrayToArrayCase7),
      // h(ArrayToArrayCase8),
      // h(ArrayToArrayCase9),
      h(ArrayToArrayCase10),
    ]);
  },
};
