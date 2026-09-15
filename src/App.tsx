import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from '@azure/msal-react';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import LogoutButton from './components/LogoutButton';

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Entra Web Template</h1>
          <p className="muted">
            Sign in, inspect tokens &amp; claims, and call Microsoft Graph.
          </p>
        </div>
        <AuthenticatedTemplate>
          <LogoutButton />
        </AuthenticatedTemplate>
      </header>

      <main className="app__main">
        <UnauthenticatedTemplate>
          <LoginScreen />
        </UnauthenticatedTemplate>
        <AuthenticatedTemplate>
          <Dashboard />
        </AuthenticatedTemplate>
      </main>

      <footer className="app__footer muted small">
        Public SPA client (PKCE) · no secrets · for developer debugging only.
      </footer>
    </div>
  );
}
