/**@jsx Reaction.createElement */
import Reaction from './core/reaction';
import { createRoot } from './core/reaction-dom';

const root = document.getElementById('root');

const el = (
  <div>
    <h1 style='color: red'>This is Title</h1>
    <h2>Hello World</h2>
    <h3>Mini React</h3>
  </div>
);

createRoot(root as HTMLElement).render(el);
