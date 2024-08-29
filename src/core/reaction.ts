const Reaction = {
  createElement,
  renderRecursively,
  render,
  update,
  useState,
};

let nextUnitOfWork: IFiber = null;
let wipRoot: IFiber = null; // 根节点, commitRoot 时用到
let deletions: IFiber[] = []; // 需要删除的节点，在commit阶段删除
let wipFiber: IFiber = null; // 当前工作的fiber节点, 用于更新, 不用每一次都从根节点开始
let hookIndex: number; // 当前useState的索引

/**
 * The workLoop function performs a work loop until there is no more work to be done or the idle deadline is reached.
 *
 * @param ddl - The idle deadline object that provides information about the available time for work.
 */
function workLoop(ddl: IdleDeadline) {
  while (nextUnitOfWork && ddl.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    if (wipRoot?.sibling?.type === nextUnitOfWork?.type) {
      // 当更新完这个组件后，结束
      nextUnitOfWork = undefined;
    }
  }

  if (!nextUnitOfWork && wipRoot) {
    console.info('Render complete.');
    console.groupEnd(); // end render phase
    console.group('Commit Phase');
    console.info('Committing root fiber...');
    commitRoot(wipRoot);
    console.info('Commit complete.');
    console.groupEnd();
  }
  requestIdleCallback(workLoop);
}

/**
 * Renders the given element into the specified container.
 *
 * @param element - The element to render.
 * @param container - The container node to render the element into.
 */
function render(element: IElement, container: HTMLElement) {
  wipRoot = {
    alternate: null,
    return: null,
    child: null,
    sibling: null,
    type: 'root',
    flag: 'PLACEMENT',
    stateNode: container,
    props: {
      children: [element], // 这里的child还不是fiber
    },
  };
  nextUnitOfWork = wipRoot; // 开启渲染
  console.group('Render Phase');
  console.info('Render Start...');
  requestIdleCallback(workLoop);
}

/**
 * Updates an object component.
 *
 * @param fiber - The fiber representing the component.
 */
function updateObjectComponent(fiber: IFiber) {
  // 1. 创建DOM节点, 函数组件的函数本身是没有对应的DOM节点的
  if (!fiber.stateNode) {
    const dom = createDOM(fiber.type as string);
    updateProps(dom, fiber.props, {});
    fiber.stateNode = dom;
  }
  const children = fiber.props.children;
  // 2. 遍历children创建子Fiber,构建一层Fiber树
  reconcileChildren(fiber, children);
}

/**
 * Updates a function component.
 *
 * @param fiber - The fiber representing the function component.
 */
function updateFunctionComponent(fiber: IFiber) {
  wipFiber = fiber;
  wipFiber.stateHooks = [];
  hookIndex = 0;
  const children = [(fiber.type as Function)(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState<T>(init: T): [T, (action: (v: T) => T) => void] {
  const currentFiber = wipFiber;

  // 从currentFiber中拿到旧的state, 如果没有，初始化为init
  const oldStateHook = currentFiber?.alternate?.stateHooks[hookIndex];
  const stateHook = {
    state: oldStateHook ? oldStateHook.state : init,
  };
  hookIndex++;
  currentFiber.stateHooks.push(stateHook); // 保存新的state到fiber中

  function setState(action: (v: T) => T): void {
    // 拿到新的state
    stateHook.state = action(stateHook.state);
    // 触发更新
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
    nextUnitOfWork = wipRoot;
  }

  return [stateHook.state, setState];
}

/**
 * Reconciles the children of a fiber node.
 * Create children fiber nodes and link them together.
 *
 * @param fiber - The fiber node to reconcile the children for.
 * @param children - The array of children to reconcile.
 */
function reconcileChildren(fiber: IFiber, children: ChildType[]): void {
  let alternateFiber = fiber.alternate?.child; // 第一次渲染时，alternateFiber为null
  let prevFiber: IFiber = null;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const isSameType = alternateFiber && alternateFiber.type === child.type;

    let newFiber: IFiber = null;
    if (isSameType) {
      // UPDATE, 复用旧的fiber节点
      newFiber = {
        alternate: alternateFiber,
        return: fiber,
        child: null,
        sibling: null,
        type: alternateFiber.type,
        stateNode: alternateFiber.stateNode, // 复用旧的stateNode
        props: child.props, // 更新props
        flag: 'UPDATE',
      };
    } else {
      // type不一致，创建新的，删除旧的
      // child有可能是false，这时候跳过渲染
      if (child) {
        newFiber = {
          alternate: null,
          return: fiber,
          child: null,
          sibling: null,
          type: child.type,
          stateNode: null,
          props: child.props,
          flag: 'PLACEMENT',
        };
      }
      if (alternateFiber) {
        deletions.push(alternateFiber);
      }
    }

    if (alternateFiber) {
      alternateFiber = alternateFiber.sibling; // 指向下一个旧的fiber节点
    }

    if (i === 0) {
      fiber.child = newFiber; // 第一个是亲儿子
    } else {
      prevFiber.sibling = newFiber;
    }

    if (newFiber) {
      prevFiber = newFiber;
    }
  }
  // 如果旧的fiber节点多于新的fiber节点，删除多余的
  while (alternateFiber) {
    deletions.push(alternateFiber);
    alternateFiber = alternateFiber.sibling;
  }
}

/**
 * Performs a unit of work on a fiber.
 *
 * @param fiber - The fiber to perform work on.
 * @returns The next unit of work to be performed.
 */
function performUnitOfWork(fiber: IFiber): IFiber {
  console.info(`Rendering ${fiber.type} ...`);

  // 根据fiber的类型，调用不同的更新函数
  if (isFunctionComponent(fiber)) {
    updateFunctionComponent(fiber);
  } else {
    updateObjectComponent(fiber);
  }

  /**
   * 返回下一个工作单元
   * 1. 如果有子节点，返回子节点
   * 2. 如果有兄弟节点，返回兄弟节点
   * 3. 向上查找第一个有兄弟节点的祖先节点，返回兄弟节点
   */
  if (fiber.child) return fiber.child;
  if (fiber.sibling) return fiber.sibling;
  let nextFiber = fiber.return;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.return;
  }
  return null;
}

/**
 * Checks if the given fiber is a function component.
 *
 * @param fiber - The fiber to check.
 * @returns A boolean indicating whether the fiber is a function component.
 */
function isFunctionComponent(fiber: IFiber): boolean {
  return typeof fiber.type === 'function';
}

/**
 * Commits the changes made in the root fiber to the DOM.
 *
 * @param {IFiber} rootFiber - The root fiber representing the component tree.
 */
function commitRoot(fiber: IFiber) {
  commitDeletions(deletions);
  commitWork(fiber.child);
  wipRoot = null; // 清空rootFiber，表示commit结束
  deletions = [];
}

function commitDeletions(deletions: IFiber[]) {
  deletions.forEach((fiber) => {
    let parentFiber = fiber.return; // 找到有DOM节点的父节点
    while (!parentFiber.stateNode) {
      parentFiber = parentFiber.return;
    }
    if (fiber.stateNode) {
      parentFiber.stateNode.removeChild(fiber.stateNode);
    } else {
      // FC
      parentFiber.stateNode.removeChild(fiber.child.stateNode);
    }
  });
}

/**
 * Commits the work done by a fiber to the DOM.
 *
 * @param fiber - The fiber to commit.
 */
function commitWork(fiber: IFiber) {
  if (!fiber) return;
  console.info(`Committing ${fiber.type} ...`);

  // 如果是FC的第一个元素，函数没有对应的DOM节点可以挂载，要向上找到有DOM节点的父节点
  let parentFiber = fiber.return;
  while (!parentFiber.stateNode) {
    parentFiber = parentFiber.return;
  }

  if (fiber.flag === 'PLACEMENT') {
    if (fiber.stateNode) {
      // FC没有对应的DOM节点，不需要挂载
      parentFiber.stateNode.appendChild(fiber.stateNode);
    }
  } else if (fiber.flag === 'UPDATE' && fiber.stateNode) {
    // FC没有对应的DOM节点，不需要更新
    updateProps(fiber.stateNode, fiber.props, fiber.alternate?.props);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/**
 * Creates a DOM element based on the given type.
 *
 * @param type - The type of the element to create.
 * @returns The created DOM element.
 */
function createDOM(type: string): HTMLElement | Text {
  return type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(type);
}

/**
 * Updates the properties and events of a DOM node with the values from the given props object.
 *
 * @param {Object} props - The props object containing the property-value pairs to update.
 * @param {Node} dom - The DOM node to update.
 * @returns {void}
 */
function updateProps(
  dom: HTMLElement | Text,
  nextProps: Object,
  prevProps: Object
): void {
  // if (dom instanceof Text) return; // 文本节点没有属性需要更新

  // 1. prevProps中有，nextProps中没有，删除属性
  Object.keys(prevProps).forEach((key) => {
    if (key !== 'children' && !nextProps.hasOwnProperty(key)) {
      if (dom instanceof HTMLElement) {
        dom.removeAttribute(key);
      }
    }
  });
  // 2. prevProps中没有，nextProps中有，添加属性
  // 3. prevProps中有，nextProps中有，更新属性
  Object.keys(nextProps).forEach((key) => {
    if (key !== 'children' && nextProps[key] !== prevProps[key]) {
      if (key.startsWith('on')) {
        const eventType = key.slice(2).toLowerCase();
        dom.removeEventListener(eventType, prevProps[key]);
        dom.addEventListener(eventType, nextProps[key]);
      } else {
        dom[key] = nextProps[key];
      }
    }
  });
}

function update() {
  const currentFiber = wipFiber;
  return () => {
    // 闭包，保存当前的fiber节点，当组件更新的时候，可以直接从这个组件开始
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
    nextUnitOfWork = wipRoot;
  };
}

/**
 * Renders the given element recursively into the specified container.
 *
 * @param element - The element to render.
 * @param container - The container element where the element will be rendered.
 */
function renderRecursively(element: IElement, container: Node) {
  // 1. 创建DOM节点
  const dom =
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type as string); // 暂时不考虑FC
  // 2. 设置属性
  for (const key in element.props) {
    if (key !== 'children' && element.props.hasOwnProperty(key)) {
      dom[key] = element.props[key];
    }
  }
  // 3. 递归渲染子节点
  element.props.children.forEach((child) =>
    renderRecursively(child as IElement, dom)
  );
  // 4. 将DOM节点挂载到容器上
  container.appendChild(dom);
}

/**
 * Creates an element with the specified type, props, and children.
 *
 * @param type - The type of the element.
 * @param props - The props object for the element.
 * @param children - The children of the element.
 * @returns An object representing the created element.
 */
function createElement(
  type: ElementType,
  props: Object,
  ...children: ChildType[]
): IElement {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        // 如果子节点是对象，直接返回；如果是其他（字符串，数字），创建文本节点
        return typeof child === 'string' || typeof child === 'number'
          ? createTextNode(child)
          : child;
      }),
    },
  };
}

/**
 * Creates a text node for a given text.
 *
 * @param text - The text value for the text node.
 * @returns The created text node.
 */
function createTextNode(text: string): ITextNode {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export { createElement, renderRecursively, render, update, useState };
export default Reaction;
