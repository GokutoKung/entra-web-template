import { InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useAuthConfig } from '../auth/context';
import { toMessage } from '../utils/error';

export default function LoginScreen() {
  const { instance, inProgress } = useMsal();
  const { loginRequest } = useAuthConfig();
  const busy = inProgress !== InteractionStatus.None;

  function login() {
    instance.loginRedirect(loginRequest).catch((error) => {
      console.error('loginRedirect failed:', toMessage(error));
    });
  }

  return (
    <div className="card card--center">
      <h2>Not signed in</h2>
      <p className="muted">
        Sign in with your Microsoft work / school account to inspect the tokens
        and claims returned by Microsoft Entra ID.
      </p>
      <button
        type="button"
        className="btn btn--primary"
        onClick={login}
        disabled={busy}
      >
        {inProgress === InteractionStatus.Login
          ? 'Redirecting…'
          : 'Sign in with Microsoft'}
      </button>
    </div>
  );
}
