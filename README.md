# mini-react

```shell
pnpm i
pnpm run dev
```

> 参考： https://github.com/pomber/didact

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
  - 一个**JS对象**，来描述元素节点，V-DOM
  - 包含字段`type`, `props`, `ref`, `key`

下图描述了`JSX`是如何经过`Babel`编译和`createElement`函数处理最终变为JS对象的,也就是VDOM
![从JSX到Object的过程 ](./assets/jsx.svg)

### createRoot()

## 任务调度

由于JS是单线程的，一次性渲染整棵的DOM树会阻塞页面交互，这时需要一种方法能将一个大任务拆分成很多个小任务一次完成。

> [requestIdleCallback(callback)](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)

使用`requestIdleCallback`可以在浏览器空闲时刻发起渲染，下一步是将渲染整个DOM拆成多个小任务。

目前得到的VDOM树存在子节点无法向上查找父节点，也没办法找到相邻节点，这就导致如果将任务拆分开来，无法通过当前的任务找到下一个任务。为了解决这个问题，需要提出一种新的数据结构，就是`Fiber`。

## Fiber

一个真实的ReactFiber是这样的:
[react-reconciler/src/RectInternalTypes.js](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactInternalTypes.js)
```js
{
  // Instance
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null;

  // Fiber
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;
  this.refCleanup = null;

  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  // Effects
  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  this.deletions = null;

  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  this.alternate = null;
}
```

在mini-react中可以简化一下
```js
{
  alternate: IFiber,
  return: IFiber,
  child: IFiber,
  sibling: IFiber,
  type: string | Function,
  stateNode: Node,
  key,
  ref,
  props
}
```

## Render 和 Commit

如果在每一次render完一个fiber，立刻commit到DOM树中，很可能会出现用户同时看到一部分更新后的UI和一部分未更新的UI

为了解决这个问题，需要吧Render和Commit两个阶段分开

## Function Component

可以把函数组件的函数理解为一个箱子，并没有一个真正的DOM节点对应这个箱子

```jsx
function App({ name }) {
  return <h1>Hello</h1>
}

<App name={"Kelvin"}/>
```

经过Babel编译后会变成

```js
function App({
  name
}) {
  return /*#__PURE__*/React.createElement("h1", null, "Hello");
}
/*#__PURE__*/React.createElement(App, {
  name: "Kelvin"
});
```

所以其实调用函数组件的过程就是执行这个函数，它的返回值就是需要渲染的节点

```js
/**
 * 这句代码会把App这个函数当作type封装成VDOM
 * 所以函数组件的VDOM的type是函数
 * 如果想要拿到函数组件的child，就需要调用它
 */
React.createElement(App, null)
```

## 注册事件

在JSX中，事件以`on`开头

将`fiber.props`中所有以`on`开头的属性解析出来，并注册到事件

## 更新Props

更新`props`的过程首先要经过`diff`，找到前后两棵fiber树的不同处，然后创建更新任务

在每一次`render`后，都需要保留本次的fiber树，作为下一次的`fiber.alternate`
