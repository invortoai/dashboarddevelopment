import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add security imports
import { initializeAppSecurity } from './services/security/initializeAppSecurity';
import SecurityProvider from './components/security/SecurityProvider';

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

// Wrap the application with our SecurityProvider
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SecurityProvider>
      <App />
    </SecurityProvider>
  </React.StrictMode>,
)
