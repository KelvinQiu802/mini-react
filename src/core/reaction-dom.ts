const ReactionDOM = {
  renderRecursively,
};

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

  container.appendChild(dom);
}

export { renderRecursively };
export default ReactionDOM;
