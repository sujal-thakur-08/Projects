import React, { createContext, useContext, useState, useCallback } from 'react';

// Create the Counter Context
const CounterContext = createContext();

// Counter Provider Component
export const CounterProvider = ({ children }) => {
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState([0]);

  // Action to increment counter
  const increment = useCallback(() => {
    setCount(prevCount => {
      const newCount = prevCount + 1;
      setHistory(prev => [...prev, newCount]);
      return newCount;
    });
  }, []);

  // Action to decrement counter
  const decrement = useCallback(() => {
    setCount(prevCount => {
      const newCount = prevCount - 1;
      setHistory(prev => [...prev, newCount]);
      return newCount;
    });
  }, []);

  // Action to reset counter
  const reset = useCallback(() => {
    setCount(0);
    setHistory([0]);
  }, []);

  // Action to add custom value
  const addValue = useCallback((value) => {
    setCount(prevCount => {
      const newCount = prevCount + value;
      setHistory(prev => [...prev, newCount]);
      return newCount;
    });
  }, []);

  // Determine the state (positive, negative, or neutral)
  const getState = () => {
    if (count > 0) return 'Positive';
    if (count < 0) return 'Negative';
    return 'Neutral';
  };

  const value = {
    count,
    history,
    state: getState(),
    increment,
    decrement,
    reset,
    addValue,
  };

  return (
    <CounterContext.Provider value={value}>
      {children}
    </CounterContext.Provider>
  );
};

// Custom hook to use Counter Context
export const useCounter = () => {
  const context = useContext(CounterContext);
  if (!context) {
    throw new Error('useCounter must be used within CounterProvider');
  }
  return context;
};
