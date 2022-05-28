import { h } from '../../lib/plasticine-mini-vue.esm.js';

export const Foo = {
  setup(props) {
    // 假设 props 中有一个 count 属性
    console.log('props: ', props);
    props.count++;
    console.log('props: ', props);
  },
  render() {
    return h('div', {}, `foo: ${this.count}`);
  },
};
