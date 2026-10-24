// Pembungkus pengiriman data ke API yang dipakai bersama oleh form (HomestayForm, RoomForm, form pemesanan).
// Mengurus tiga hal yang tadinya diulang di tiap form: status "sedang menyimpan",
// error terakhir dari API (untuk <Alert>), dan notifikasi toast saat gagal.
import { toErrorInfo } from '#lib/api';
import { useToast } from '#lib/toast.svelte.js';

// Harus dipanggil saat inisialisasi komponen (bukan di dalam event handler) karena memakai konteks toast.
export function createSubmitter() {
  const toast = useToast();
  let saving = $state(false);
  let error = $state(null);

  return {
    get saving() {
      return saving;
    },
    get error() {
      return error;
    },
    clearError() {
      error = null;
    },
    // Menjalankan `action` (fungsi async yang memanggil API). Tidak pernah melempar error:
    // hasilnya { ok: true, value } atau { ok: false, error }.
    async run(action) {
      saving = true;
      error = null;
      try {
        return { ok: true, value: await action() };
      } catch (err) {
        error = toErrorInfo(err);
        toast.error(error.message);
        return { ok: false, error };
      } finally {
        saving = false;
      }
    }
  };
}
