// Menyediakan data sesi ke seluruh halaman: data.user (atau null).
// Token sengaja TIDAK dikirim ke browser: ia hanya hidup di cookie httpOnly, dan pemanggilan API dari browser
// lewat proxy /api yang menambahkan token di server.
export function load({ locals }) {
  return { user: locals.user };
}
