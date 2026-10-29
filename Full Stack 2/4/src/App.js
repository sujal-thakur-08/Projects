import React from 'react';
import { CounterProvider } from './context/CounterContext';
import Counter from './components/Counter';
import './App.css';

function App() {
  return (
    <CounterProvider>
      <div className="container">
        <Counter />
      </div>
    </CounterProvider>
  );
}

export default App;
