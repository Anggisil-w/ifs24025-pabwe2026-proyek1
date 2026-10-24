// Memulihkan sesi dari cookie pada setiap request dan menyediakan konteks pemanggilan API untuk loader server.
import { fetchCurrentUser } from '#lib/api';
import { clearSessionCookie, readSessionToken } from './cookie.js';

// Mengisi event.locals.user / event.locals.token. Dipanggil dari hooks.server.js.
export async function attachSession(event) {
  event.locals.user = null;
  event.locals.token = null;

  const token = readSessionToken(event.cookies);
  if (!token || event.url.pathname.startsWith('/_app/')) return;

  try {
    event.locals.user = await fetchCurrentUser(token, { fetch: event.fetch });
    event.locals.token = token;
  } catch (err) {
    // 401 = token kedaluwarsa/palsu/akun dihapus -> hapus cookie.
    // Kegagalan lain (backend mati, error tak terduga) -> biarkan cookie, anggap belum login untuk request ini.
    if (err?.status === 401) clearSessionCookie(event.cookies);
  }
}

// Opsi untuk fungsi di #lib/api dari dalam loader/action server: fetch milik SvelteKit + token sesi (jika ada)
export const apiOptions = (event) => ({ fetch: event.fetch, token: event.locals.token ?? undefined });
