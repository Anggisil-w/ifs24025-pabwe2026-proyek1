// Helper sesi login bersama (dipakai hooks, halaman login/register, dan logout)

export const COOKIE_NAME = 'mj_token';
const SEVEN_DAYS = 7 * 24 * 60 * 60; // sama dengan masa berlaku token di backend

export function sessionCookieOptions(url) {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: SEVEN_DAYS
  };
}

// Hanya menerima path internal ("/bookings"). "//evil.com" atau "https://..." ditolak (open redirect).
export function safeNext(value, fallback = '/') {
  const next = String(value ?? '');
  return next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') ? next : fallback;
}
