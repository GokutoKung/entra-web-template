import {
  type AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useState } from 'react';
import { useAuthConfig } from '../auth/context';
import { toMessage } from '../utils/error';
import { decodeJwt } from '../utils/jwt';
import CopyButton from './CopyButton';
import JsonBlock from './JsonBlock';

export default function TokenPanel() {
  const { instance, accounts } = useMsal();
  const { loginRequest } = useAuthConfig();
  const [result, setResult] = useState<AuthenticationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function acquire() {
    setBusy(true);
    setError(null);
    const account = instance.getActiveAccount() ?? accounts[0];
    try {
      const res = await instance.acquireTokenSilent({
        scopes: loginRequest.scopes,
        account,
      });
      setResult(res);
    } catch (silentError) {
      if (silentError instanceof InteractionRequiredAuthError) {
        try {
          setResult(
            await instance.acquireTokenPopup({ scopes: loginRequest.scopes }),
          );
        } catch (popupError) {
          setError(toMessage(popupError));
        }
      } else {
        setError(toMessage(silentError));
      }
    } finally {
      setBusy(false);
    }
  }

  const decoded = result ? decodeJwt(result.accessToken) : null;

  return (
    <section className="card">
      <div className="card__head">
        <h2>Access token</h2>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={acquire}
          disabled={busy}
        >
          {busy ? 'Acquiring…' : 'Acquire token'}
        </button>
      </div>
      <p className="muted">
        Scopes: <code>{loginRequest.scopes.join(' ')}</code>
      </p>

      {error && <p className="error">{error}</p>}

      {result && (
        <>
          <div className="meta">
            <span className="badge">
              expires: {result.expiresOn?.toLocaleString() ?? '-'}
            </span>
            <span className="badge">granted: {result.scopes.join(', ')}</span>
          </div>

          <h3>
            Raw token <CopyButton text={result.accessToken} />
          </h3>
          <pre className="token">{result.accessToken}</pre>

          <h3>Decoded payload</h3>
          {decoded ? (
            <JsonBlock value={decoded.payload} />
          ) : (
            <p className="muted">
              This access token is opaque (not a decodable JWT). The raw value
              above still works as a bearer token.
            </p>
          )}
        </>
      )}
    </section>
  );
}
