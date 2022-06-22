import { h, ref } from '../../lib/plasticine-mini-vue.esm.js';

// ==================== Case1: 左端对比 ====================
const prevChildrenCase1 = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
];

const nextChildrenCase1 = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'E' }, 'E'),
];

export const ArrayToArrayCase1 = {
  name: 'ArrayToArrayCase1',
  setup() {
    const toggleChildrenCase1 = ref(true);
    window.toggleChildrenCase1 = toggleChildrenCase1;

    return {
      toggleChildrenCase1,
    };
  },
  render() {
    return this.toggleChildrenCase1
      ? h('div', {}, prevChildrenCase1)
      : h('div', {}, nextChildrenCase1);
  },
};

// ==================== Case2: 右端对比 ====================
const prevChildrenCase2 = [
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'F' }, 'F'),
  h('p', { key: 'G' }, 'G'),
];

const nextChildrenCase2 = [
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'H' }, 'H'),
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'F' }, 'F'),
  h('p', { key: 'G' }, 'G'),
];

export const ArrayToArrayCase2 = {
  name: 'ArrayToArrayCase2',
  setup() {
    const toggleChildrenCase2 = ref(true);
    window.toggleChildrenCase2 = toggleChildrenCase2;

    return {
      toggleChildrenCase2,
    };
  },
  render() {
    return this.toggleChildrenCase2
      ? h('div', {}, prevChildrenCase2)
      : h('div', {}, nextChildrenCase2);
  },
};

// ==================== Case3: 新的比旧的多 -- 右端创建 ====================
const prevChildrenCase3 = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
];

const nextChildrenCase3 = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'E' }, 'E'),
];

export const ArrayToArrayCase3 = {
  name: 'ArrayToArrayCase3',
  setup() {
    const toggleChildrenCase3 = ref(true);
    window.toggleChildrenCase3 = toggleChildrenCase3;

    return {
      toggleChildrenCase3,
    };
  },
  render() {
    return this.toggleChildrenCase3
      ? h('div', {}, prevChildrenCase3)
      : h('div', {}, nextChildrenCase3);
  },
};

// ==================== Case4: 新的比旧的多 -- 左端创建 ====================
const prevChildrenCase4 = [
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'A' }, 'A'),
];

const nextChildrenCase4 = [
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'A' }, 'A'),
];

export const ArrayToArrayCase4 = {
  name: 'ArrayToArrayCase4',
  setup() {
    const toggleChildrenCase4 = ref(true);
    window.toggleChildrenCase4 = toggleChildrenCase4;

    return {
      toggleChildrenCase4,
    };
  },
  render() {
    return this.toggleChildrenCase4
      ? h('div', {}, prevChildrenCase4)
      : h('div', {}, nextChildrenCase4);
  },
};

// ==================== Case5: 新的比旧的多 -- 右端删除 ====================
const prevChildrenCase5 = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'E' }, 'E'),
];

const nextChildrenCase5 = [
  h('p', { key: 'A' }, 'A'),
  h('p', { key: 'B' }, 'B'),
];

export const ArrayToArrayCase5 = {
  name: 'ArrayToArrayCase5',
  setup() {
    const toggleChildrenCase5 = ref(true);
    window.toggleChildrenCase5 = toggleChildrenCase5;

    return {
      toggleChildrenCase5,
    };
  },
  render() {
    return this.toggleChildrenCase5
      ? h('div', {}, prevChildrenCase5)
      : h('div', {}, nextChildrenCase5);
  },
};

// ==================== Case6: 新的比旧的多 -- 左端删除 ====================
const prevChildrenCase6 = [
  h('p', { key: 'E' }, 'E'),
  h('p', { key: 'D' }, 'D'),
  h('p', { key: 'C' }, 'C'),
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'A' }, 'A'),
];

const nextChildrenCase6 = [
  h('p', { key: 'B' }, 'B'),
  h('p', { key: 'A' }, 'A'),
];

export const ArrayToArrayCase6 = {
  name: 'ArrayToArrayCase6',
  setup() {
    const toggleChildrenCase6 = ref(true);
    window.toggleChildrenCase6 = toggleChildrenCase6;

    return {
      toggleChildrenCase6,
    };
  },
  render() {
    return this.toggleChildrenCase6
      ? h('div', {}, prevChildrenCase6)
      : h('div', {}, nextChildrenCase6);
  },
};
