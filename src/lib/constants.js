// Konstanta status pesanan yang dipakai UI (cermin aturan backend; backend tetap penentu akhir)

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

export const STATUS_LABELS = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  cancelled: 'Dibatalkan',
  completed: 'Selesai',
  active: 'Aktif',
  inactive: 'Nonaktif'
};

// Perpindahan status yang ditawarkan di UI (cermin aturan backend; backend tetap penentu akhir)
export const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: []
};

// Label tombol aksi untuk status tujuan
export const STATUS_ACTIONS = {
  confirmed: 'Konfirmasi',
  completed: 'Tandai selesai',
  cancelled: 'Batalkan'
};
