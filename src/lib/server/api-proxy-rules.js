// Aturan murni untuk proxy API same-origin (routes/api/[...path]/+server.js).
// Browser memanggil /api/* di domain frontend; server menambahkan token dari cookie httpOnly lalu meneruskan
// ke backend. Dengan begitu token tidak pernah dikirim ke JavaScript browser.

// Hanya sumber daya data yang boleh dilewatkan; /auth/* sengaja tidak ada (login/register lewat form action)
const ALLOWED_PATH = /^(?:homestays|rooms|bookings)(?:\/[A-Za-z0-9_-]+)*$/;

export const FORWARDED_METHODS = Object.freeze(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
export const MAX_BODY_BYTES = 64 * 1024;
export const UPSTREAM_TIMEOUT_MS = 15_000;

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const isAllowedApiPath = (path) => typeof path === 'string' && ALLOWED_PATH.test(path);

// Request yang mengubah data hanya diterima dari halaman kita sendiri. Browser selalu mengirim Origin pada
// request non-GET; request tanpa Origin berasal dari klien non-browser (tidak bisa jadi korban CSRF).
export function isTrustedOrigin(method, originHeader, appOrigin) {
  if (SAFE_METHODS.has(method.toUpperCase())) return true;
  return originHeader === null || originHeader === undefined || originHeader === appOrigin;
}

export const errorBody = (message) => JSON.stringify({ error: { message, details: [] } });
