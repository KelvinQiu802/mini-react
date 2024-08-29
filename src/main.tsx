/**@jsx Reaction.createElement */
import Reaction, { useState } from './core/reaction';
import { createRoot } from './core/reaction-dom';

const root = document.getElementById('root');

interface Props {
  name: string;
  age: number;
}

function App({ name, age }: Props) {
  const [count, setCount] = useState(1);
  const [bar, setBar] = useState(2);
  const handleClick = () => {
    setCount((v) => v + 1);
  };
  const handleBar = () => {
    setBar((v) => v + 1);
  };
  return (
    <div>
      <button onClick={handleClick}>{count}</button>
      <button onClick={handleBar}>{bar}</button>
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
