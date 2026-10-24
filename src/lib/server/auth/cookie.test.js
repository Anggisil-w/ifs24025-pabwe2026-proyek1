import { describe, it, expect } from 'vitest';
import { SESSION_COOKIE, SESSION_MAX_AGE, clearSessionCookie, readSessionToken, sessionCookieOptions, setSessionCookie } from './cookie.js';

function fakeCookies(initial = {}) {
  const jar = new Map(Object.entries(initial));
  const calls = [];
  return {
    calls,
    get: (name) => jar.get(name),
    set: (name, value, options) => (calls.push(['set', name, value, options]), jar.set(name, value)),
    delete: (name, options) => (calls.push(['delete', name, options]), jar.delete(name))
  };
}

describe('cookie sesi', () => {
  it('selalu httpOnly + sameSite=lax; secure hanya di https', () => {
    const https = sessionCookieOptions(new URL('https://contoh.com/'));
    const http = sessionCookieOptions(new URL('http://localhost:5173/'));
    expect(https).toMatchObject({ path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: SESSION_MAX_AGE });
    expect(http.secure).toBe(false);
    expect(http.httpOnly).toBe(true);
  });

  it('set, baca, dan hapus', () => {
    const cookies = fakeCookies();
    setSessionCookie(cookies, 'tok', new URL('https://contoh.com/'));
    expect(cookies.calls[0].slice(0, 3)).toEqual(['set', SESSION_COOKIE, 'tok']);
    expect(readSessionToken(cookies)).toBe('tok');
    clearSessionCookie(cookies);
    expect(cookies.calls[1]).toEqual(['delete', SESSION_COOKIE, { path: '/' }]);
    expect(readSessionToken(cookies)).toBeNull();
  });
});
