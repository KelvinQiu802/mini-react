type ElementType = string;
type ChildType = IElement | string;

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
