// Konteks sesi untuk komponen. Menggantikan pembacaan `page.data.user` yang tersebar dan
// variabel modul global: konteks Svelte dibuat per-render sehingga aman untuk SSR
// (tidak ada state yang bocor antar-request di server).
//
// Pemakaian:
//   +layout.svelte  ->  provideSession(() => data.user)
//   komponen mana pun ->  const session = useSession();  session.user, session.isAdmin, ...
import { getContext, setContext } from 'svelte';
import { hasRole, isAdmin } from './roles.js';

const SESSION_KEY = Symbol('mulakjabu.session');

// getUser dipanggil ulang setiap properti dibaca, sehingga selalu mengikuti data layout terbaru
export function createSession(getUser) {
  return {
    get user() {
      return getUser() ?? null;
    },
    get isAuthenticated() {
      return Boolean(getUser());
    },
    get isAdmin() {
      return isAdmin(getUser());
    },
    hasRole: (...roles) => hasRole(getUser(), ...roles)
  };
}

export function provideSession(getUser) {
  const session = createSession(getUser);
  setContext(SESSION_KEY, session);
  return session;
}

export function useSession() {
  const session = getContext(SESSION_KEY);
  if (!session) throw new Error('useSession() hanya bisa dipakai di dalam +layout.svelte utama (provideSession belum dipanggil).');
  return session;
}
