import { requireUser } from '#lib/server/auth/guards';

// Penjaga seluruh halaman di bawah /bookings: belum login -> /login?next=...
export function load(event) {
  requireUser(event);
}
