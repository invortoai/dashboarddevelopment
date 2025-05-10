
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add security imports
import { initializeAppSecurity } from './services/security/initializeAppSecurity';

// Initialize security features
if (typeof window !== 'undefined') {
  initializeAppSecurity()
    .then(({ success, message }) => {
      if (success) {
        console.log('Security initialized:', message);
      } else {
        console.error('Security initialization failed:', message);
      }
    })
    .catch(error => {
      console.error('Error during security initialization:', error);
    });
}

// In main.tsx we don't need the SecurityProvider
// since it will be properly placed within App.tsx after AuthProvider
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
