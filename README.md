# mini-vue

[![author](https://img.shields.io/badge/author-Plasticine--Yang-blue)](https://github.com/Plasticine-Yang)

实现 vue3 的核心逻辑，忽略边缘 case，旨在理解 vue3 的设计理念

目前已实现了 reactivity、runtime-core 和 runtime-dom 模块

## Features

- 使用`rollup`打包，支持`ESModule`和`CommonJS`两种模块化方案

### reactivity

基于`TDD`的思想，每个功能都是先编写相应的单元测试，然后再去进行实现，可以直接使用`jest`运行单元测试查看结果

- [x] 实现`effect`核心逻辑，基于`proxy`完成依赖收集和触发依赖
- [x] 实现`effect`的`scheduler`和`stop`功能，为`runtime-core`的数据更新和视图异步渲染提供基础支持
- [x] 实现`reactive`响应式对象核心特性，支持将嵌套对象也转成`reactive`对象
- [x] 实现`reactive`相关 API，如`isReactive`、`isProxy`
- [x] 实现`readonly`和`shallowReadonly`，以及`isReadonly`判断是否为`readonly`对象
- [x] 实现`ref`的核心特性
- [x] 实现`ref`的相关 API，如`isRef`、`unRef`、`proxyRefs`
- [x] 复用`effect`中的`ReactiveEffect`类实现`computed`计算属性

### runtime-core

- [x] 实现`vnode`
- [x] 实现`ShapeFlags`位运算标识`vnode`类型，目前主要支持组件类型、`Element`类型、`Text`类型的`vnode`
- [x] 实现组件的`props`初始化逻辑
- [x] 实现默认插槽、具名插槽和作用域插槽
- [x] `props`支持传入`onXxx`用于监听`xxx`事件，如`onClick`可监听`click`事件
- [x] 实现组件的`emit`逻辑
- [x] 实现组件的`setup API`，能够在`setup`中获取到`props`和`context`
- [x] 实现组件的`render`函数中通过`this`访问`setup`返回的`setupState`，基于`proxy`实现
- [x] 实现`getCurrentInstance`，可在`setup`中调用获取当前组件实例
- [x] 实现`provide/inject`
- [x] 在`render`函数中可通过`this.$el`获取组件的根挂载点`DOM`对象
- [x] 在`render`函数中可通过`this.$props`访问`setup`中的`props`
- [x] 抽离`Element`的渲染相关逻辑成自定义渲染器接口，并在`runtime-dom`模块中实现具体接口完成`DOM`环境下的渲染
- [x] 使用`diff`算法实现`Element`的更新逻辑
- [x] 实现组件的更新逻辑
- [x] 实现`nextTick`，可在`setup`中访问到更新后的组件实例

## 学习心得

在学习`vue3`源码实现`mini-vue`的过程中，把自己的一些心得全都记录了下来，在掘金上发布了一个专栏，每一个功能对应的实现思路都有记录

[掘金专栏 -- 手把手带你实现 mini-vue](https://juejin.cn/column/7100095488849870878)
