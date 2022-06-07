import { h, ref } from '../../lib/plasticine-mini-vue.esm.js';

export const App = {
  name: 'App',
  setup() {
    const count = ref(0);
    const props = ref({
      name: 'foo',
      age: 20,
    });

    const onClick = () => {
      count.value++;
    };

    const changeProps = () => {
      props.value.name = props.value.name === 'foo' ? 'bar' : 'foo';
      props.value.age++;
    };

    const removeProps = () => {
      props.value.name = undefined;
    };

    const removeProps2 = () => {
      // 移除掉 age 属性
      props.value = {
        name: 'foo',
      };
    };

    return {
      count,
      onClick,
      props,
      changeProps,
      removeProps,
      removeProps2,
    };
  },
  render() {
    return h('div', { name: this.props.name, age: this.props.age }, [
      h('div', {}, `count: ${this.count}`),
      h('button', { onClick: this.onClick }, 'click'),
      h(
        'button',
        {
          onClick: this.changeProps,
        },
        'changeProps'
      ),
      h('button', { onClick: this.removeProps }, 'removeProps'),
      h('button', { onClick: this.removeProps2 }, 'removeProps2'),
    ]);
  },
};
