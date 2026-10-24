# Arsitektur autentikasi & validasi frontend

## Prinsip
- **Token tidak pernah sampai ke JavaScript browser.** Token backend hanya ada di cookie `httpOnly` (`mj_token`).
  Tidak ada `localStorage`, tidak ada variabel modul global berisi token, dan `data.token` tidak lagi dikirim lewat layout.
- **Server-side rendering aman.** State bersama (sesi, notifikasi) memakai *konteks Svelte* yang dibuat per-render,
  bukan singleton modul yang dipakai bersama semua request.

## Peta modul (`src/lib`)
| Modul | Tugas |
|---|---|
| `auth/redirect.js` | `safeNext`, `loginPath`, `withNext` — anti open-redirect (murni) |
| `auth/roles.js`, `auth/access.js` | peran dan keputusan akses `ALLOW / LOGIN / FORBIDDEN` (murni, teruji) |
| `auth/session.js` | konteks sesi untuk komponen: `provideSession()` di layout, `useSession()` di komponen |
| `server/auth/cookie.js` | satu-satunya tempat yang membaca/menulis/menghapus cookie sesi |
| `server/auth/session.js` | `attachSession(event)` (dipakai hooks) dan `apiOptions(event)` untuk loader |
| `server/auth/guards.js` | `requireUser`, `requireAdmin`, `redirectIfAuthenticated` — satu-satunya tempat `redirect()`/`error(403)` untuk akses |
| `server/api-proxy-rules.js` | aturan murni proxy `/api` (allowlist path, cek Origin, batas body) |
| `validation/rules.js` | aturan dasar: email, telepon, URL, tanggal kalender, bilangan bulat, teks + `LIMITS` |
| `validation/forms.js` | `validateLogin/Register/Homestay/Room/Booking` → `{ valid, errors, data }` |
| `toast.svelte.js` | `provideToaster()` / `useToast()` |

Catatan: `src/lib/auth.js` (versi lama) sudah dihapus; `server/auth/cookie.js` dan `auth/redirect.js` adalah satu-satunya sumber kebenaran.

`+layout.js` tidak ada; guard berada di `+layout.server.js` tiap grup rute dan hanya memanggil `guards.js`.

## Alur data
- **Baca data** (beranda, detail, admin, pesanan): semua lewat `+page.server.js`; server memanggil backend langsung
  dengan token dari `locals` (`apiOptions(event)`).
- **Ubah data dari browser** (form homestay/kamar/pesanan, tombol status): `#lib/api` memanggil `/api/*` di domain sendiri;
  `routes/api/[...path]/+server.js` menambahkan token dari cookie lalu meneruskan ke backend.
  Hanya `homestays`, `rooms`, `bookings` yang diteruskan; `auth/*` tidak (login/register lewat form action).
- **Validasi**: fungsi yang sama dipakai di komponen (umpan balik langsung), di form action server (validasi ulang),
  dan batasnya cermin dari validator Zod backend. Backend tetap penentu akhir.
