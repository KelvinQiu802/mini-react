const Reaction = {
  createElement,
  renderRecursively,
  render,
  update,
};

let nextUnitOfWork: IFiber = null;
let rootFiber: IFiber = null; // 根节点, commitRoot 时用到
let prevRootFiber: IFiber = null; // 上一次的根节点

/**
 * The workLoop function performs a work loop until there is no more work to be done or the idle deadline is reached.
 *
 * @param ddl - The idle deadline object that provides information about the available time for work.
 */
function workLoop(ddl: IdleDeadline) {
  while (nextUnitOfWork && ddl.timeRemaining() > 1) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  if (!nextUnitOfWork && rootFiber) {
    console.info('Render complete.');
    console.groupEnd(); // end render phase
    console.group('Commit Phase');
    console.info('Committing root fiber...');
    commitRoot(rootFiber);
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
  rootFiber = {
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
  nextUnitOfWork = rootFiber; // 开启渲染
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
  createChildrenFiber(fiber, children);
}

/**
 * Updates a function component.
 *
 * @param fiber - The fiber representing the function component.
 */
function updateFunctionComponent(fiber: IFiber) {
  const children = [(fiber.type as Function)(fiber.props)];
  createChildrenFiber(fiber, children);
}

/**
 * Creates child fibers for a given parent fiber.
 *
 * @param fiber - The parent fiber.
 * @param children - An array of child elements.
 */
function createChildrenFiber(fiber: IFiber, children: ChildType[]): void {
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
      // 新建fiber节点
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
      alternateFiber = alternateFiber.sibling; // 指向下一个旧的fiber节点
    }

    if (i === 0) {
      fiber.child = newFiber; // 第一个是亲儿子
    } else {
      prevFiber.sibling = newFiber;
    }
    prevFiber = newFiber;
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
  commitWork(fiber.child);
  prevRootFiber = rootFiber; // 保存当前的根节点
  rootFiber = null; // 清空rootFiber，表示commit结束
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
  rootFiber = {
    alternate: prevRootFiber, // 指向上一次的根节点
    return: null,
    child: null,
    sibling: null,
    type: null,
    flag: null,
    stateNode: prevRootFiber.stateNode,
    props: prevRootFiber.props, // 保持上一次的props
  };

  nextUnitOfWork = rootFiber;
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
      children: children.map((child) =>
        // 如果子节点是对象，直接返回；如果是其他（字符串，数字），创建文本节点
        typeof child === 'object' ? child : createTextNode(child)
      ),
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

export { createElement, renderRecursively, render, update };
export default Reaction;
