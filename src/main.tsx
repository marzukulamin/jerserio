import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import Preview3DPage from './components/Preview3DPage.tsx';
import './index.css';

const Root = window.location.pathname === '/preview-3d' ? Preview3DPage : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
