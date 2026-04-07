import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

window.addEventListener('error', (e) => {
    console.error("Window Error Log: ", e.message, e.filename, e.lineno);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);