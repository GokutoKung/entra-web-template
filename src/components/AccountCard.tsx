import { useMsal } from '@azure/msal-react';
import JsonBlock from './JsonBlock';

export default function AccountCard() {
  const { instance, accounts } = useMsal();
  const account = instance.getActiveAccount() ?? accounts[0];

  if (!account) return null;

  const summary = {
    name: account.name,
    username: account.username,
    'localAccountId (oid)': account.localAccountId,
    homeAccountId: account.homeAccountId,
    environment: account.environment,
  };

  return (
    <section className="card">
      <h2>Account</h2>
      <p className="muted">Signed-in account resolved by MSAL.</p>
      <JsonBlock value={summary} />
      <h3>ID token claims</h3>
      <JsonBlock value={account.idTokenClaims ?? {}} />
    </section>
  );
}
