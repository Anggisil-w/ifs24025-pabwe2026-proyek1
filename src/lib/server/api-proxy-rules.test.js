import { describe, it, expect } from 'vitest';
import { errorBody, isAllowedApiPath, isTrustedOrigin } from './api-proxy-rules.js';

describe('isAllowedApiPath', () => {
  it('mengizinkan sumber daya data', () => {
    for (const ok of ['homestays', 'homestays/3', 'homestays/3/rooms', 'rooms', 'rooms/12', 'bookings', 'bookings/9/status']) {
      expect(isAllowedApiPath(ok), ok).toBe(true);
    }
  });

  it('menolak auth, traversal, dan path aneh', () => {
    const bad = [
      'auth/login',
      'auth/me',
      '',
      '/homestays',
      'homestays/',
      'homestays/../auth/login',
      'homestays/%2e%2e/auth',
      'homestays//3',
      'homestays/3?x=1',
      'users',
      'homestaysextra',
      null,
      undefined
    ];
    for (const value of bad) expect(isAllowedApiPath(value), String(value)).toBe(false);
  });
});

describe('isTrustedOrigin', () => {
  const app = 'https://mulakjabu.example';

  it('request baca selalu lolos', () => {
    expect(isTrustedOrigin('GET', 'https://evil.com', app)).toBe(true);
  });

  it('request ubah data harus dari origin sendiri (atau tanpa Origin = bukan browser)', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      expect(isTrustedOrigin(method, app, app)).toBe(true);
      expect(isTrustedOrigin(method, null, app)).toBe(true);
      expect(isTrustedOrigin(method, 'https://evil.com', app)).toBe(false);
      expect(isTrustedOrigin(method, 'null', app)).toBe(false);
    }
  });
});

describe('errorBody', () => {
  it('berformat sama dengan error backend', () => {
    expect(JSON.parse(errorBody('gagal'))).toEqual({ error: { message: 'gagal', details: [] } });
  });
});
