type ElementType = string | Function;
type ChildType = IElement | ITextNode;
type Flags = 'PLACEMENT' | 'UPDATE' | 'DELETION';

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
  stateNode: HTMLElement | Text;
  flag: Flags;
  props: {
    children: ChildType[];
  };
}
