/**@jsx Reaction.createElement */
import Reaction, { update } from './core/reaction';
import { createRoot } from './core/reaction-dom';

const root = document.getElementById('root');

interface Props {
  name: string;
  age: number;
}

let toggle = false;

function App({ name, age }: Props) {
  const handleClick = () => {
    toggle = !toggle;
    update();
  };
  return (
    <div>
      <div>{toggle && <h1>Toggle is true</h1>}</div>
      <button onClick={handleClick}>Toggle</button>
    </div>
  );
}

function Wrapper() {
  return (
    <div>
      <App name={'Kelvin'} age={21} />
    </div>
  );
}

createRoot(root as HTMLElement).render(<Wrapper />);
