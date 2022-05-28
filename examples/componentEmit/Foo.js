import { h } from '../../lib/plasticine-mini-vue.esm.js';

export const Foo = {
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log('emit add');
      emit('add', 1, 2);
      emit('add-value');
    };

    return {
      emitAdd,
    };
  },
  render() {
    return h(
      'button',
      {
        onClick: this.emitAdd,
      },
      'add'
    );
  },
};
