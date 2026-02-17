import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  
  // Render the app
  root.render(React.createElement(React.StrictMode, null, React.createElement(App)));

  // Remove the splash screen after the first paint
  requestAnimationFrame(() => {
    const splash = document.getElementById('splash');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }
  });
}