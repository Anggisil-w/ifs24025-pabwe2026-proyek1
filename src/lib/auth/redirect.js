// Utilitas pengalihan yang aman dan murni (tanpa akses ke request/cookie), dipakai server maupun browser.

const FALLBACK_PATH = '/';

// Hanya menerima path internal ("/bookings?status=pending").
// Ditolak: "//evil.com", "/\evil.com", "https://...", "javascript:...", serta karakter kontrol/spasi
// yang dipakai untuk menyelundupkan tujuan lain (mis. "/\t/evil.com" yang diperbaiki browser menjadi "//evil.com").
export function safeNext(value, fallback = FALLBACK_PATH) {
  if (typeof value !== 'string') return fallback;
  if (value.length === 0 || value.length > 2048) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('\\') || /[\p{Cc}\s]/u.test(value)) return fallback;
  return value;
}

// URL halaman login yang akan mengembalikan pengguna ke `target` setelah berhasil masuk.
// `target` selalu dibersihkan lewat safeNext, jadi aman dipakai untuk redirect.
export function loginPath(target = FALLBACK_PATH) {
  const next = safeNext(target);
  return next === FALLBACK_PATH ? '/login' : `/login?next=${encodeURIComponent(next)}`;
}

// Tautan antar halaman login <-> register yang mempertahankan tujuan akhir (?next=)
export function withNext(path, next) {
  const safe = safeNext(next);
  return safe === FALLBACK_PATH ? path : `${path}?next=${encodeURIComponent(safe)}`;
}
