const Reaction = {
  createElement,
  renderRecursively,
};

/**
 * Renders the given element recursively into the specified container.
 *
 * @param element - The element to render.
 * @param container - The container element where the element will be rendered.
 */
function renderRecursively(element: IElement, container: HTMLElement | Text) {
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

export { createElement, renderRecursively };
export default Reaction;
