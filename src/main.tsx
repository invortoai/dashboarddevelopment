
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add security imports
import { initializeAppSecurity } from './services/security/initializeAppSecurity';

// Initialize security features before rendering the app
async function initAndRender() {
  if (typeof window !== 'undefined') {
    try {
      const { success, message } = await initializeAppSecurity();
      if (success) {
        console.log('Security initialized:', message);
      } else {
        console.error('Security initialization failed:', message);
      }
    } catch (error) {
      console.error('Error during security initialization:', error);
    }
  }
  
  // Render app after security initialization
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

// Start initialization and rendering
initAndRender();
