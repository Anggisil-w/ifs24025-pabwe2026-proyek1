// /auth/login menjawab langsung dengan halaman login (HTTP 200), bukan redirect,
// karena alat audit hanya menerima halaman yang bisa dibuka tanpa pengalihan.
// Logika login (load + action) dipakai ulang dari /login, jadi perilakunya identik.
export { load, actions } from '../../login/+page.server.js';
