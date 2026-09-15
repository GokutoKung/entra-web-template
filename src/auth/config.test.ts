import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadAuthConfig } from './config';

function stubConfig(body: string, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok, status, text: async () => body })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadAuthConfig', () => {
  it('parses a valid config and applies defaults', async () => {
    stubConfig(
      ['azure:', '  clientId: "client-1"', '  tenantId: "tenant-1"'].join('\n'),
    );
    const result = await loadAuthConfig();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.clientId).toBe('client-1');
    expect(result.config.tenantId).toBe('tenant-1');
    expect(result.config.authorityHost).toBe('login.microsoftonline.com');
    expect(result.config.scopes).toEqual(['User.Read']);
  });

  it('reports missing required keys', async () => {
    stubConfig('azure: {}');
    const result = await loadAuthConfig();
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.includes('clientId'))).toBe(true);
    expect(result.errors.some((e) => e.includes('tenantId'))).toBe(true);
  });

  it('fails when /config.yaml cannot be loaded', async () => {
    stubConfig('not found', false, 404);
    const result = await loadAuthConfig();
    expect(result.ok).toBe(false);
  });

  it('accepts scopes as a space-separated string', async () => {
    stubConfig(
      [
        'azure:',
        '  clientId: "c"',
        '  tenantId: "t"',
        '  scopes: "User.Read openid"',
      ].join('\n'),
    );
    const result = await loadAuthConfig();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.scopes).toEqual(['User.Read', 'openid']);
  });

  it('accepts scopes as a list', async () => {
    stubConfig(
      [
        'azure:',
        '  clientId: "c"',
        '  tenantId: "t"',
        '  scopes:',
        '    - User.Read',
        '    - Mail.Read',
      ].join('\n'),
    );
    const result = await loadAuthConfig();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.scopes).toEqual(['User.Read', 'Mail.Read']);
  });
});
