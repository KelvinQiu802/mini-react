/**@jsx Reaction.createElement */
import Reaction from './core/reaction';
import { renderRecursively } from './core/reaction-dom';

const root = document.getElementById('root');

const el = (
  <div>
    <h1>This is Title</h1>
    <h2>Hello World</h2>
    <h3>Mini React</h3>
  </div>
);

renderRecursively(el, root as HTMLElement);
