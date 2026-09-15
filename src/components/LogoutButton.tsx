import { useMsal } from '@azure/msal-react';
import { toMessage } from '../utils/error';

export default function LogoutButton() {
  const { instance } = useMsal();
  const account = instance.getActiveAccount() ?? undefined;

  function logout() {
    // Redirect logout also clears the Entra ID server session (clean re-login).
    instance.logoutRedirect({ account }).catch((error) => {
      console.error('logoutRedirect failed:', toMessage(error));
    });
  }

  return (
    <button type="button" className="btn btn--danger" onClick={logout}>
      Sign out{account?.username ? ` · ${account.username}` : ''}
    </button>
  );
}
