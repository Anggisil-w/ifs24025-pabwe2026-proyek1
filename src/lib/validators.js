// Pintu masuk tunggal untuk validasi sisi klien. Isi sebenarnya ada di folder validation/:
//   rules.js  -> aturan dasar (email, telepon, URL, tanggal, angka, teks) + batas panjang
//   forms.js  -> validator per form (login, register, homestay, kamar, pemesanan)
export * from './validation/rules.js';
export * from './validation/forms.js';
