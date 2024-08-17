/**@jsx Reaction.createElement */
import Reaction from './core/reaction';
import { createRoot } from './core/reaction-dom';

const root = document.getElementById('root');

interface Props {
  name: string;
  age: number;
}

function App({ name, age }: Props) {
  return (
    <div>
      <h1 style='color: red'>This is Title</h1>
      <h2>
        Hello {name} {age}
      </h2>
      <h3>Mini React</h3>
    </div>
  );
}

function Wrapper() {
  return (
    <div>
      <App name={'Kelvin'} age={21} />
      <App name={'Kelvin'} age={21} />
      <button onClick={() => console.log('Hello World')}>Counter</button>
    </div>
  );
}

createRoot(root as HTMLElement).render(<Wrapper />);
