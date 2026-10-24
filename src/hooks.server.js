import { attachSession } from '#lib/server/auth/session';
import { friendlyErrorMessage } from '#lib/errors';

// Setiap request: pulihkan sesi dari cookie httpOnly (logikanya ada di lib/server/auth/session.js).
// Hasilnya tersedia di event.locals.user (null jika belum login atau sesi tidak valid).
export async function handle({ event, resolve }) {
  await attachSession(event);

  // Header keamanan dasar
  event.setHeaders({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });

  return resolve(event);
}

// Error tak terduga di server: catat detailnya di log, tampilkan pesan ramah ke pengunjung.
export function handleError({ error, status }) {
  console.error(error);
  return { message: friendlyErrorMessage(status) };
}
