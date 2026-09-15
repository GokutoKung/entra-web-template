import { parse } from 'yaml';
import { toMessage } from '../utils/error';

export interface AuthConfig {
  clientId: string;
  tenantId: string;
  authorityHost: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  scopes: string[];
}

export type ConfigResult =
  { ok: true; config: AuthConfig } | { ok: false; errors: string[] };

const CONFIG_URL = '/config.yaml';
const DEFAULT_AUTHORITY_HOST = 'login.microsoftonline.com';
const DEFAULT_SCOPES = ['User.Read'];

interface RawConfig {
  azure?: {
    clientId?: string;
    tenantId?: string;
    authorityHost?: string;
    redirectUri?: string;
    postLogoutRedirectUri?: string;
    scopes?: string[] | string;
  };
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function parseScopes(
  value: string[] | string | undefined,
  fallback: string[],
): string[] {
  const list = Array.isArray(value)
    ? value.map((scope) => String(scope).trim())
    : typeof value === 'string'
      ? value.split(/[\s,]+/).map((scope) => scope.trim())
      : [];
  const scopes = list.filter(Boolean);
  return scopes.length > 0 ? scopes : fallback;
}

export async function loadAuthConfig(): Promise<ConfigResult> {
  let raw: RawConfig;
  try {
    const response = await fetch(CONFIG_URL, { cache: 'no-store' });
    if (!response.ok) {
      return {
        ok: false,
        errors: [`Could not load ${CONFIG_URL} (HTTP ${response.status}).`],
      };
    }
    raw = (parse(await response.text()) as RawConfig | null) ?? {};
  } catch (error) {
    return {
      ok: false,
      errors: [`Could not load ${CONFIG_URL}: ${toMessage(error)}`],
    };
  }

  const azure = raw.azure ?? {};
  const clientId = str(azure.clientId);
  const tenantId = str(azure.tenantId);

  const errors: string[] = [];
  if (!clientId) errors.push('azure.clientId');
  if (!tenantId) errors.push('azure.tenantId');
  if (!clientId || !tenantId) {
    return { ok: false, errors };
  }

  const redirectUri = str(azure.redirectUri) ?? window.location.origin;

  return {
    ok: true,
    config: {
      clientId,
      tenantId,
      authorityHost: str(azure.authorityHost) ?? DEFAULT_AUTHORITY_HOST,
      redirectUri,
      postLogoutRedirectUri: str(azure.postLogoutRedirectUri) ?? redirectUri,
      scopes: parseScopes(azure.scopes, DEFAULT_SCOPES),
    },
  };
}
