import { friendlyErrorMessage } from '#lib/errors';

// Error tak terduga di browser (mis. gagal memuat data di navigasi sisi klien).
// Dicatat ke konsol untuk pengembang; pengunjung hanya melihat pesan yang ramah di +error.svelte.
export function handleError({ error, status }) {
  console.error(error);
  return { message: friendlyErrorMessage(status) };
}
