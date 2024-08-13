import { render } from './reaction';

const ReactionDOM = {
  createRoot,
};

/**
 * Creates a root element for rendering in the specified container.
 * @param container - The HTML element that serves as the container for the root element.
 * @returns An object with a `render` method that can be used to render an element into the root.
 */
function createRoot(container: HTMLElement) {
  return {
    render(element: IElement) {
      render(element, container);
    },
  };
}

export { createRoot };
export default ReactionDOM;
