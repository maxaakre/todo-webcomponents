import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@maxaakre/ui/tokens.css';
import { App } from './App.js';

document.body.style.cssText =
  'margin:0; background:var(--ui-color-bg); color:var(--ui-color-text); font:var(--ui-font-size)/var(--ui-line-height) var(--ui-font-family)';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
