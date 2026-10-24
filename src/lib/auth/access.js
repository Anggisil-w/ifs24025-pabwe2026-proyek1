// Keputusan akses yang murni (tanpa efek samping): mudah diuji dan dipakai ulang oleh guard server.
// Guard server (lib/server/auth/guards.js) hanya menerjemahkan keputusan ini menjadi redirect()/error().

export const ACCESS = Object.freeze({ ALLOW: 'allow', LOGIN: 'login', FORBIDDEN: 'forbidden' });

// roles kosong -> cukup sudah login; selain itu pengguna harus punya salah satu peran tersebut
export function evaluateAccess(user, roles = []) {
  if (!user) return ACCESS.LOGIN;
  if (roles.length > 0 && !roles.includes(user.role)) return ACCESS.FORBIDDEN;
  return ACCESS.ALLOW;
}
