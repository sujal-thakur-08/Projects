import React from 'react';
import { useCounter } from '../context/CounterContext';
import './Counter.css';

const Counter = () => {
  const { count, state, increment, decrement, reset, addValue } = useCounter();

  return (
    <div className="counter-wrapper">
      <h1>Counter App</h1>
      
      <div className={`counter-display ${state.toLowerCase()}`}>
        <span className="counter-value">{count}</span>
      </div>
      
      <div className="button-group">
        <button 
          className="btn btn-decrement"
          onClick={decrement}
        >
          <span>−</span>
        </button>
        
        <button 
          className="btn btn-reset"
          onClick={reset}
        >
          <span>Reset</span>
        </button>
        
        <button 
          className="btn btn-increment"
          onClick={increment}
        >
          <span>+</span>
        </button>
      </div>

      <div className="quick-add">
        <button className="btn btn-small" onClick={() => addValue(10)}>+10</button>
        <button className="btn btn-small" onClick={() => addValue(-10)}>-10</button>
      </div>
      
      <div className="state-info">
        <p className="state-label">
          State: <span className={`state-badge ${state.toLowerCase()}`}>{state}</span>
        </p>
      </div>
    </div>
  );
};

export default Counter;
