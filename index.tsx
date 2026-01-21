import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Ensure the root element has proper styling
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

// Set initial styles
rootElement.style.display = 'flex';
rootElement.style.flexDirection = 'column';
rootElement.style.minHeight = '100vh';
rootElement.style.width = '100%';
rootElement.style.backgroundColor = '#f1f5f9';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

