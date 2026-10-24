// Penjaga halaman untuk loader/action server. Satu-satunya tempat yang tahu cara menolak akses:
// belum login -> redirect ke /login?next=..., peran tidak sesuai -> 403.
// Dipakai di +layout.server.js / +page.server.js; tidak ada lagi redirect manual yang tersebar.
import { error, redirect } from '@sveltejs/kit';
import { ACCESS, evaluateAccess } from '#lib/auth/access';
import { loginPath, safeNext } from '#lib/auth/redirect';

// Mengembalikan { user, token } atau menghentikan request.
export function requireUser(event, ...roles) {
  const { locals, url } = event;
  const decision = evaluateAccess(locals.user, roles);

  if (decision === ACCESS.LOGIN) redirect(303, loginPath(url.pathname + url.search));
  if (decision === ACCESS.FORBIDDEN) error(403, 'Kamu tidak punya akses ke halaman ini');
  return { user: locals.user, token: locals.token };
}

// Khusus halaman admin
export const requireAdmin = (event) => requireUser(event, 'admin');

// Halaman untuk tamu (login/register): yang sudah masuk langsung dikembalikan ke tujuan (?next=).
// Mengembalikan { next } yang sudah aman untuk dipakai sebagai redirect.
export function redirectIfAuthenticated({ locals, url }) {
  const next = safeNext(url.searchParams.get('next'));
  if (locals.user) redirect(303, next);
  return { next };
}
