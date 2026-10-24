// Notifikasi (toast) berbasis rune Svelte 5 dan konteks komponen.
//
// Dulu berupa singleton modul. Di server, singleton modul dipakai bersama oleh SEMUA request, jadi state
// bisa bocor antar pengguna. Sekarang toaster dibuat per-render di +layout.svelte lewat provideToaster()
// dan diambil dengan useToast() di komponen anak (dipanggil saat inisialisasi komponen, bukan di event handler):
//
//   const toast = useToast();
//   async function save() { ...; toast.success('Tersimpan'); }
import { getContext, setContext } from 'svelte';

const DEFAULT_DURATION = 5000;
const ERROR_DURATION = 8000;
const TOAST_KEY = Symbol('mulakjabu.toast');

export class Toaster {
  items = $state([]);
  #nextId = 1;
  #timers = new Map();

  show(message, variant = 'info', duration = DEFAULT_DURATION) {
    const id = this.#nextId++;
    this.items.push({ id, message, variant });
    // Timer hanya di browser (di server tidak ada interaksi yang memunculkan toast)
    if (duration > 0 && typeof window !== 'undefined') {
      this.#timers.set(id, setTimeout(() => this.dismiss(id), duration));
    }
    return id;
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = ERROR_DURATION) {
    return this.show(message, 'error', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  dismiss(id) {
    clearTimeout(this.#timers.get(id));
    this.#timers.delete(id);
    this.items = this.items.filter((item) => item.id !== id);
  }

  // Membersihkan semua timer saat layout dilepas
  destroy() {
    for (const timer of this.#timers.values()) clearTimeout(timer);
    this.#timers.clear();
  }
}

export function provideToaster() {
  const toaster = new Toaster();
  setContext(TOAST_KEY, toaster);
  return toaster;
}

export function useToast() {
  const toaster = getContext(TOAST_KEY);
  if (!toaster) throw new Error('useToast() hanya bisa dipakai di dalam +layout.svelte utama (provideToaster belum dipanggil).');
  return toaster;
}
