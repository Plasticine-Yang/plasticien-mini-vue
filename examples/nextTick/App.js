import {
  h,
  ref,
  getCurrentInstance,
  nextTick,
} from '../../lib/plasticine-mini-vue.esm.js';

export const App = {
  name: 'App',
  setup() {
    const instance = getCurrentInstance();
    const count = ref(0);
    const addCount = () => {
      for (let i = 0; i < 100; i++) {
        count.value++;
      }
      nextTick(() => {
        debugger;
        console.log(instance.vnode.el);
      });
    };

    return {
      count,
      addCount,
    };
  },
  render() {
    return h('div', {}, [
      h('p', {}, `count: ${this.count}`),
      h('button', { onClick: this.addCount }, 'add count by 100 steps'),
    ]);
  },
};
