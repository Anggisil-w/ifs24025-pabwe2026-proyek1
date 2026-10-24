# Mulak Jabu — Front-end

Antarmuka web platform manajemen dan pemesanan homestay lokal. Proyek 1 PABWE 2026, Institut Teknologi Del.

Repository ini hanya berisi **front-end**. Back-end (Express + SQLite) ada di repository terpisah: `ifs24025-pabwe2026-proyek1-backend`.

## Teknologi

| Lapisan | Teknologi |
| --- | --- |
| Framework | SvelteKit + Tailwind CSS |
| Pengujian | Vitest + Testing Library |
| Runtime produksi | Bun (`adapter-bun`), Vercel (`adapter-vercel` jika `VERCEL=1`) |
| CI/CD | Jenkins + SonarQube |

## Menjalankan Secara Lokal

Jalankan dulu back-end (lihat README repository back-end) di `http://localhost:3000`.

```bash
bun install               # atau: npm install
cp .env.example .env      # Windows: copy .env.example .env
bun run dev               # http://localhost:5173
```

## Variabel Environment

| Variabel | Contoh | Keterangan |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` | `http://localhost:3000/api` | Base URL back-end. Dibaca saat build, jadi perlu build ulang jika diubah. |

Browser tidak memanggil back-end langsung; semua perubahan data lewat proxy `/api` milik server SvelteKit.

## Rute

| Rute | Fungsi |
| --- | --- |
| `/` | Katalog homestay |
| `/homestays/[id]` | Detail homestay dan pemesanan |
| `/bookings` | Daftar pemesanan |
| `/admin` | Kelola homestay dan kamar (admin) |
| `/login`, `/auth/login`, `/register`, `/logout` | Autentikasi |

Arsitektur autentikasi dan validasi: `docs/FRONTEND-AUTH.md`.

## Arsitektur Singkat

```
src/
├── hooks.server.js        pulihkan sesi dari cookie httpOnly di setiap request, pasang header keamanan
├── lib/
│   ├── api.js             satu-satunya klien API (server: langsung ke backend; browser: lewat proxy /api)
│   ├── auth/              logika autentikasi murni dan teruji: redirect aman, peran, keputusan akses, konteks sesi
│   ├── server/            kode yang hanya jalan di server: cookie sesi, guard rute, aturan proxy API
│   ├── validation/        aturan validasi per kolom (rules.js) dan per form (forms.js); pintu masuknya validators.js
│   └── components/        komponen UI bersama (Modal, ConfirmDialog, Alert, Badge, ...), masing-masing punya *.test.js
└── routes/                halaman; data dibaca lewat +page.server.js, perubahan data lewat form action atau proxy /api
```

Alur singkatnya:

1. **Membaca data**: `+page.server.js` memanggil backend langsung memakai token dari `event.locals` (`apiOptions(event)`).
2. **Mengubah data dari browser**: komponen memanggil `/api/*` di domain sendiri; `routes/api/[...path]/+server.js` menempelkan token dari cookie lalu meneruskannya ke backend.
3. **Akses halaman**: seluruh keputusan redirect atau 403 hanya ada di `lib/server/auth/guards.js`.
4. **Token tidak pernah sampai ke JavaScript browser** (tidak ada `localStorage`).

Satu sumber kebenaran: logika sesi/cookie hanya ada di `lib/server/auth/cookie.js`, dan logika redirect aman hanya ada di `lib/auth/redirect.js`.
Penjelasan lengkap ada di `docs/FRONTEND-AUTH.md`.

## Aksesibilitas Komponen

`Modal` (dan `ConfirmDialog` di atasnya) memenuhi pola dialog WAI-ARIA: `role="dialog"` + `aria-modal`, judul lewat `aria-labelledby`,
deskripsi opsional lewat `aria-describedby`, fokus pindah ke dalam dialog saat dibuka, terkunci di dalamnya (Tab/Shift+Tab berputar),
dikembalikan ke pemicu saat ditutup, Esc menutup, dan gulir halaman di belakangnya dikunci.

## Perintah

```bash
bun run test              # vitest
bun run test:coverage     # menghasilkan coverage/lcov.info untuk SonarQube
bun run check             # svelte-check
bun run build && bun run start
```
