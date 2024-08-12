# mini-react

```shell
pnpm i
pnpm run dev
```

## 创建并渲染元素

所有React项目都包含的一行代码

```js
React.createRoot(document.getElementById('root')).render(<App />);
```

第一部分的内容就是模仿`ReactAPI`，实现在页面上渲染元素。

### createElement()

> API文档: [React.createElement(type, props, ...children)](https://react.dev/reference/react/createElement)

- **入参**
  - **type**
    - 可以是`div`这样的标签名
    - 也可以是一个 React 组件（函数组件就是函数，类组件就是类）
  - **props**
    - 属性对象或者`null`
  - **...children**
    - 0 或多个子元素
- **返回值**
  - 一个**JS对象**，来描述元素节点
  - 包含字段`type`, `props`, `ref`, `key`

下图描述了`JSX`是如何经过`Babel`编译和`createElement`函数处理最终变为JS对象的
![从JSX到Object的过程 ](./assets/jsx.svg)

### createRoot()
