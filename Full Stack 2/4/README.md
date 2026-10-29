# Context API State Management

A React application demonstrating state management using the Context API. This project implements a counter app with global state management.

## Features

- **React Context API**: Centralized state management without Redux
- **Custom Hooks**: `useCounter` hook for easy access to state and actions
- **Responsive Design**: Works on desktop and mobile devices
- **Multiple Actions**: Increment, decrement, reset, and custom value addition
- **State Tracking**: Visual indicators for positive, negative, and neutral states
- **History Tracking**: Keeps track of all counter values

## Project Structure

```
src/
├── components/
│   ├── Counter.js          # Main counter component
│   └── Counter.css         # Styling for counter
├── context/
│   └── CounterContext.js   # Context definition and custom hook
├── App.js                  # Main App component
├── App.css                 # App styling
├── index.js               # React entry point
└── index.css              # Global styles

public/
└── index.html             # HTML template

package.json               # Project dependencies
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sujal-thakur-08/Full-Stack-2.git
cd Full-Stack-2/4
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## How Context API is Used

### Creating the Context

The `CounterContext` is created using `React.createContext()` and provides:
- **State**: `count`, `history`
- **Actions**: `increment()`, `decrement()`, `reset()`, `addValue()`
- **Computed Values**: `state` (Positive/Negative/Neutral)

### Provider Component

The `CounterProvider` wraps the application and provides the context value to all child components.

### Consuming the Context

Components use the custom `useCounter()` hook to access the context:

```javascript
const { count, state, increment, decrement, reset } = useCounter();
```

## Usage Example

```javascript
import { useCounter } from '../context/CounterContext';

function MyComponent() {
  const { count, increment, state } = useCounter();

  return (
    <div>
      <p>Count: {count}</p>
      <p>State: {state}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Runs the test suite
- `npm eject` - Ejects from Create React App (irreversible)

## Technologies Used

- **React 18** - UI library
- **Context API** - State management
- **CSS3** - Styling
- **Create React App** - Project bootstrapping

## Benefits of Context API

1. **No Extra Dependencies**: Built into React
2. **Simple Setup**: Easy to understand and implement
3. **Avoids Prop Drilling**: Pass data without going through intermediate components
4. **Performance**: Good for small to medium apps
5. **Custom Hooks**: Create reusable logic with hooks

## Best Practices Demonstrated

- ✅ Separating context logic from components
- ✅ Creating custom hooks for context consumption
- ✅ Using `useCallback` for optimized callbacks
- ✅ Proper error handling in custom hooks
- ✅ Clear file structure and organization

## Future Enhancements

- Add localStorage persistence
- Implement action history/undo functionality
- Add theme switching context
- Create multiple contexts for different features
- Add unit tests

## License

MIT

## Author

Sujal Thakur

## Deploy online

This app is ready for Vercel or any static host that serves the React build output.

### Vercel

1. Push the repo to GitHub.
2. Import the `4` folder as the project root.
3. Build command: `npm run build`
4. Output directory: `build`
5. The included [vercel.json](vercel.json) keeps client-side routes working.
