// Cookie sesi. Token backend hanya hidup di cookie httpOnly ini, jadi tidak pernah terbaca oleh JavaScript
// di browser (XSS tidak bisa mencuri sesi) dan tidak perlu disimpan di localStorage.

export const SESSION_COOKIE = 'mj_token';
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // detik; sama dengan masa berlaku token di backend

export function sessionCookieOptions(url) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: SESSION_MAX_AGE
  };
}

export const readSessionToken = (cookies) => cookies.get(SESSION_COOKIE) || null;
export const setSessionCookie = (cookies, token, url) => cookies.set(SESSION_COOKIE, token, sessionCookieOptions(url));
export const clearSessionCookie = (cookies) => cookies.delete(SESSION_COOKIE, { path: '/' });
