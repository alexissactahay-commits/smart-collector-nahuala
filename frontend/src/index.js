// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <GoogleOAuthProvider clientId="954992204322-2ubdebhj8126lk22v2isa1lmjqv4hc1k.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);
