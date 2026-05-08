import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AppWithGoogle = () => {
  // Only wrap with GoogleOAuthProvider if client ID is actually set
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim() !== '') {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    );
  }
  // No client ID — render without provider (Google button shows "not configured" toast)
  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWithGoogle />
  </React.StrictMode>
);