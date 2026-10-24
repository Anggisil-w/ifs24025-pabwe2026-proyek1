import { redirect } from '@sveltejs/kit';
import { clearSessionCookie } from '#lib/server/auth/cookie';

// Hanya POST (dari form tombol "Keluar"), supaya logout tidak bisa dipicu lewat link/gambar dari situs lain
export function POST({ cookies }) {
  clearSessionCookie(cookies);
  redirect(303, '/');
}
