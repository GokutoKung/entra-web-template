import { describe, expect, it } from 'vitest';
import { decodeJwt, formatEpoch } from './jwt';

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

describe('decodeJwt', () => {
  it('decodes the header and payload of a JWT', () => {
    const token = [
      b64url({ alg: 'RS256', typ: 'JWT' }),
      b64url({ oid: 'abc', tid: 'tenant' }),
      'signature',
    ].join('.');
    const decoded = decodeJwt(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.header).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(decoded?.payload).toMatchObject({ oid: 'abc', tid: 'tenant' });
  });

  it('returns null when the token is not a three-part JWT', () => {
    expect(decodeJwt('not-a-jwt')).toBeNull();
    expect(decodeJwt('only.two')).toBeNull();
  });

  it('returns null when a segment is not valid JSON', () => {
    expect(decodeJwt('aaaa.bbbb.cccc')).toBeNull();
  });
});

describe('formatEpoch', () => {
  it('formats epoch seconds into a string', () => {
    expect(typeof formatEpoch(1_700_000_000)).toBe('string');
  });

  it('returns null for non-numeric input', () => {
    expect(formatEpoch('nope')).toBeNull();
    expect(formatEpoch(undefined)).toBeNull();
  });
});
