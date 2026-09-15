import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useState } from 'react';
import { toMessage } from '../utils/error';
import JsonBlock from './JsonBlock';

const GRAPH_ME_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
const GRAPH_SCOPES = ['User.Read'];

export default function GraphPanel() {
  const { instance, accounts } = useMsal();
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function acquireGraphToken(): Promise<string> {
    const account = instance.getActiveAccount() ?? accounts[0];
    try {
      const res = await instance.acquireTokenSilent({
        scopes: GRAPH_SCOPES,
        account,
      });
      return res.accessToken;
    } catch (silentError) {
      if (silentError instanceof InteractionRequiredAuthError) {
        const res = await instance.acquireTokenPopup({ scopes: GRAPH_SCOPES });
        return res.accessToken;
      }
      throw silentError;
    }
  }

  async function callGraph() {
    setBusy(true);
    setError(null);
    setData(null);
    try {
      const token = await acquireGraphToken();
      const response = await fetch(GRAPH_ME_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          `Graph responded ${response.status}: ${await response.text()}`,
        );
      }
      setData(await response.json());
    } catch (graphError) {
      setError(toMessage(graphError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <div className="card__head">
        <h2>Microsoft Graph · /me</h2>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={callGraph}
          disabled={busy}
        >
          {busy ? 'Calling…' : 'Call /me'}
        </button>
      </div>
      <p className="muted">
        Requests a <code>User.Read</code> token and calls the Graph{' '}
        <code>/me</code> endpoint — independent of the scopes above.
      </p>

      {error && <p className="error">{error}</p>}
      {data != null && <JsonBlock value={data} />}
    </section>
  );
}
