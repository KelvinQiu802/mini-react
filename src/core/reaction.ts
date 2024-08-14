const Reaction = {
  createElement,
  renderRecursively,
  render,
};

let nextUnitOfWork: IFiber = null;
let rootFiber: IFiber = null; // 根节点, commitRoot 时用到

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
function render(element: IElement, container: Node) {
  rootFiber = {
    alternate: null,
    return: null,
    child: null,
    sibling: null,
    type: 'root',
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
 * Performs a unit of work on a fiber.
 *
 * @param fiber - The fiber to perform work on.
 * @returns The next unit of work to be performed.
 */
function performUnitOfWork(fiber: IFiber): IFiber {
  console.info(`Rendering ${fiber.type} ...`);
  // 1. 创建DOM节点
  if (!fiber.stateNode) {
    const dom = createDOM(fiber.type);
    updateProps(fiber.props, dom);
    fiber.stateNode = dom;
  }
  // 2. 遍历children创建子Fiber,构建一层Fiber树
  const children = fiber.props.children;
  let prevFiber: IFiber = null;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const newFiber: IFiber = {
      alternate: null,
      return: fiber,
      child: null,
      sibling: null,
      type: child.type,
      stateNode: null,
      props: child.props,
    };
    if (i === 0) {
      fiber.child = newFiber; // 第一个是亲儿子
    } else {
      prevFiber.sibling = newFiber;
    }
    prevFiber = newFiber;
  }
  /**
   * 返回下一个工作单元
   * 1. 如果有子节点，返回子节点
   * 2. 如果有兄弟节点，返回兄弟节点
   * 3. 如果父节点有兄弟节点，返回父节点的兄弟节点
   */
  if (fiber.child) return fiber.child;
  if (fiber.sibling) return fiber.sibling;
  return fiber.return.sibling;
}

/**
 * Commits the changes made in the root fiber to the DOM.
 *
 * @param {IFiber} rootFiber - The root fiber representing the component tree.
 */
function commitRoot(fiber: IFiber) {
  commitWork(fiber.child);
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
  fiber.return.stateNode.appendChild(fiber.stateNode);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

/**
 * Creates a DOM element based on the given type.
 *
 * @param type - The type of the element to create.
 * @returns The created DOM element.
 */
function createDOM(type: string): Node {
  return type === 'TEXT_ELEMENT'
    ? document.createTextNode('')
    : document.createElement(type);
}

/**
 * Updates the properties of a DOM node with the values from the given props object.
 *
 * @param {Object} props - The props object containing the property-value pairs to update.
 * @param {Node} dom - The DOM node to update.
 * @returns {void}
 */
function updateProps(props: Object, dom: Node): void {
  for (const key in props) {
    if (key !== 'children' && props.hasOwnProperty(key)) {
      dom[key] = props[key];
    }
  }
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
      : document.createElement(element.type);
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
        // 如果 child 是字符串，创建文本节点
        typeof child === 'string' ? createTextNode(child) : child
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

export { createElement, renderRecursively, render };
export default Reaction;
