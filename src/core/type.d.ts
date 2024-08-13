type ElementType = string;
type ChildType = IElement | ITextNode;

interface IElement {
  type: ElementType;
  props: {
    children: ChildType[];
  };
}

interface ITextNode {
  type: 'TEXT_ELEMENT';
  props: {
    nodeValue: string;
    children: [];
  };
}

interface IFiber {
  alternate: IFiber;
  return: IFiber;
  child: IFiber;
  sibling: IFiber;
  type: ElementType;
  stateNode: Node;
  props: {
    children: ChildType[];
  };
}
