import '@fontsource-variable/inter';
import '@fontsource-variable/outfit';
import '@fontsource/lora/400-italic.css';
import '@fontsource/lora/500-italic.css';
import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
