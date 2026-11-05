import { initCapacitorNativeBridge } from './utils/capacitorBridge.ts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { brandService } from './services/brandService.ts';

// Initialize Capacitor Android/iOS native bridge & production API routing
initCapacitorNativeBridge();

// Initialize platform brand settings & favicon
brandService.syncWithServer();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
