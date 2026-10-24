// Pesan error ramah pengguna untuk error yang tidak tertangani (dipakai hooks.client.js dan hooks.server.js).
// Detail teknis hanya dicatat di konsol/log, tidak ditampilkan ke pengunjung.

export function friendlyErrorMessage(status) {
  if (status === 404) return 'Halaman yang kamu cari tidak ditemukan.';
  if (status === 403) return 'Kamu tidak punya akses ke halaman ini.';
  if (status === 401) return 'Sesi kamu berakhir. Silakan masuk kembali.';
  if (status >= 500 || !status) return 'Terjadi kesalahan di sistem kami. Coba lagi beberapa saat lagi.';
  return 'Permintaan tidak dapat diproses. Periksa kembali lalu coba lagi.';
}
