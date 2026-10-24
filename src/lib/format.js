// Helper format tampilan (mata uang, tanggal, durasi). Murni fungsi, tanpa akses jaringan.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// 250000 -> "Rp 250.000"
export function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

// '2026-11-01' -> "1 Nov 2026". Zona waktu UTC agar tanggal tidak bergeser sehari.
export function formatDate(isoDate) {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return String(isoDate);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

// Timestamp SQLite ('YYYY-MM-DD HH:MM:SS', UTC) -> waktu WIB
export function formatDateTime(value) {
  if (!value) return '-';
  const text = String(value);
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text) ? `${text.replace(' ', 'T')}Z` : text;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  }).format(date);
}

// Jumlah malam antara dua tanggal ISO; 0 jika kosong atau tidak valid
export function countNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const diff = Date.parse(checkOut) - Date.parse(checkIn);
  if (Number.isNaN(diff)) return 0;
  return Math.round(diff / MS_PER_DAY);
}

// Tanggal hari ini (WIB) berformat YYYY-MM-DD, sama di server dan browser agar hydration konsisten
export function todayISO() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
}
