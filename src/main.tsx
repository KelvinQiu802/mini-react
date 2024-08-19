/**@jsx Reaction.createElement */
import Reaction, { update } from './core/reaction';
import { createRoot } from './core/reaction-dom';

const root = document.getElementById('root');

interface Props {
  name: string;
  age: number;
}

let toggle = true;

function Foo() {
  return <div>FOO</div>;
}

function Bar() {
  return <div>BAR</div>;
}

function App({ name, age }: Props) {
  const handleClick = () => {
    toggle = !toggle;
    update();
  };
  return (
    <div>
      {/* <h5>
        {name} {age}
      </h5> */}
      <div>{toggle ? <Foo /> : <Bar />}</div>
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
