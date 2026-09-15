import { type AuthenticationResult, EventType } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { loadAuthConfig } from './auth/config';
import { AuthConfigProvider } from './auth/context';
import { createMsalInstance } from './auth/msal';
import ConfigError from './components/ConfigError';
import { toMessage } from './utils/error';
import './index.css';

async function bootstrap() {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('#root element not found');
  const root = ReactDOM.createRoot(rootElement);

  const result = await loadAuthConfig();
  if (!result.ok) {
    root.render(
      <React.StrictMode>
        <ConfigError errors={result.errors} />
      </React.StrictMode>,
    );
    return;
  }

  const msalInstance = createMsalInstance(result.config);
  await msalInstance.initialize();
  await msalInstance.handleRedirectPromise();

  const existingAccounts = msalInstance.getAllAccounts();
  if (existingAccounts.length > 0 && !msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(existingAccounts[0]);
  }

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult;
      msalInstance.setActiveAccount(payload.account);
    }
  });

  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <AuthConfigProvider config={result.config}>
          <App />
        </AuthConfigProvider>
      </MsalProvider>
    </React.StrictMode>,
  );
}

bootstrap().catch((error) => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.textContent = `Failed to start: ${toMessage(error)}`;
  }
  console.error(error);
});
