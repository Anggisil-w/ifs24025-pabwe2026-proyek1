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

## Perintah

```bash
bun run test              # vitest
bun run test:coverage     # menghasilkan coverage/lcov.info untuk SonarQube
bun run check             # svelte-check
bun run build && bun run start
```
