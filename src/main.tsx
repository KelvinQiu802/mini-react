/**@jsx Reaction.createElement */
import Reaction from './core/reaction';
import { createRoot } from './core/reaction-dom';

const root = document.getElementById('root');

interface Props {
  name: string;
  age: number;
}

let counter = 10; // 目前没有时间useState，所以用一个全局变量代替
let msg = '';

function App({ name, age }: Props) {
  const handleClick = () => {
    counter++;
    Reaction.update();
  };
  const handleInput = (e) => {
    msg = e.target.value;
    Reaction.update();
  };
  return (
    <div>
      <h1 style='color: red'>This is Title</h1>
      <h2>
        Hello {name} {age} {msg}
      </h2>
      <h3>Mini React</h3>
      <button onClick={handleClick}>Increment</button>
      <br />
      <label htmlFor='message'>Message</label>
      <input type='text' id='message' onInput={handleInput} />
    </div>
  );
}

function Wrapper() {
  return (
    <div>
      <App name={'Kelvin'} age={counter} />
      <App name={'Kelvin'} age={counter} />
    </div>
  );
}

createRoot(root as HTMLElement).render(<Wrapper />);
