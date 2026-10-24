import { requireAdmin } from '#lib/server/auth/guards';

// Penjaga seluruh halaman di bawah /admin: belum login -> /login?next=..., bukan admin -> 403
export function load(event) {
  requireAdmin(event);
}
