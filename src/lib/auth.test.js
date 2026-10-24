import { describe, it, expect } from 'vitest';
import { COOKIE_NAME, safeNext, sessionCookieOptions } from './auth.js';

describe('auth.js', () => {
  it('opsi cookie: secure hanya untuk https', () => {
    expect(COOKIE_NAME).toBe('mj_token');
    const https = sessionCookieOptions(new URL('https://a.test/'));
    expect(https).toMatchObject({ path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: 604800 });
    expect(sessionCookieOptions(new URL('http://a.test/')).secure).toBe(false);
  });

  it('safeNext hanya menerima path internal', () => {
    expect(safeNext('/bookings')).toBe('/bookings');
    expect(safeNext('//evil.com')).toBe('/');
    expect(safeNext('https://evil.com')).toBe('/');
    expect(safeNext('/a\\b', '/home')).toBe('/home');
    expect(safeNext(undefined)).toBe('/');
    expect(safeNext(null, '/x')).toBe('/x');
  });
});
