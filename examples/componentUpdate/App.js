import { h, ref } from '../../lib/plasticine-mini-vue.esm.js';
import { Child } from './Child.js';

export const App = {
  name: 'App',
  setup() {
    const msg = ref('hello plasticine');
    const count = ref(0);

    const changeMsg = () => {
      msg.value =
        msg.value === 'hello plasticine' ? 'hello again' : 'hello plasticine';
    };

    const addCount = () => {
      count.value++;
    };

    return { msg, changeMsg, count, addCount };
  },
  render() {
    return h('div', {}, [
      h(Child, { msg: this.msg }),
      h('button', { onClick: this.changeMsg }, 'change msg'),
      h('p', {}, `count: ${this.count}`),
      h('button', { onClick: this.addCount }, 'add count'),
    ]);
  },
};
