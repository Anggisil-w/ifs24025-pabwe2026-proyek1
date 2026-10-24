// Aturan validasi dasar yang murni. Setiap fungsi `check*` mengembalikan pesan error (string) atau undefined.
// Validasi klien hanya untuk umpan balik cepat dan mengurangi request sia-sia; backend dan
// server action tetap memvalidasi ulang (batas di sini sengaja dibuat sama dengan backend).

export const LIMITS = Object.freeze({
  EMAIL_MAX: 254,
  EMAIL_LOCAL_MAX: 64,
  PERSON_NAME: { min: 2, max: 100 },
  PASSWORD: { min: 8, max: 72 }, // batas atas sama dengan backend
  HOMESTAY_NAME: { min: 3, max: 100 },
  ROOM_NAME: { min: 2, max: 100 },
  ROOM_TYPE: { min: 2, max: 50 },
  CITY_MAX: 100,
  ADDRESS_MAX: 200,
  DESCRIPTION_MAX: 2000,
  URL_MAX: 500,
  CAPACITY: { min: 1, max: 50 },
  PRICE: { min: 0, max: 100_000_000 },
  GUESTS: { min: 1, max: 100 }
});

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const PHONE_PATTERN = /^\+?[0-9\s\-()]{6,20}$/; // sama dengan backend
const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export const PHONE_MESSAGE = 'Nomor telepon tidak valid (6-15 angka; boleh memakai spasi, +, -, dan kurung)';

// ---------- Normalisasi & predikat ----------

export const toText = (value) => (value === null || value === undefined ? '' : String(value));
export const trimmed = (value) => toText(value).trim();
export const isBlank = (value) => trimmed(value) === '';
export const hasControlChars = (value) => CONTROL_CHARS.test(toText(value));

export function isValidEmail(value) {
  const email = trimmed(value);
  if (email.length === 0 || email.length > LIMITS.EMAIL_MAX) return false;
  const local = email.slice(0, email.lastIndexOf('@'));
  if (local.length > LIMITS.EMAIL_LOCAL_MAX || local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return false;
  }
  return EMAIL_PATTERN.test(email);
}

export function isValidPhone(value) {
  const phone = trimmed(value);
  if (!PHONE_PATTERN.test(phone)) return false;
  const digits = phone.replace(/\D/g, '').length;
  return digits >= 6 && digits <= 15; // batas E.164
}

// Hanya http/https, dengan host, tanpa kredensial (user:pass@) dan tanpa spasi
export function isValidHttpUrl(value) {
  const text = trimmed(value);
  if (text.length === 0 || text.length > LIMITS.URL_MAX || /\s/.test(text)) return false;
  try {
    const url = new URL(text);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname !== '' && !url.username && !url.password;
  } catch {
    return false;
  }
}

// YYYY-MM-DD yang benar-benar ada di kalender (menolak 2026-02-31)
export function isValidIsoDate(value) {
  const match = ISO_DATE_PATTERN.exec(toText(value));
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Bilangan bulat dari angka atau teks digit murni ("12"); selain itu NaN (menolak "1e3", "1.5", "0x10", "")
export function toInteger(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : NaN;
  const text = trimmed(value);
  return /^-?\d+$/.test(text) ? Number(text) : NaN;
}

// ---------- Pemeriksa field (mengembalikan pesan error atau undefined) ----------

export function checkText(value, { label, min = 0, max, required = true, singleLine = true }) {
  const text = trimmed(value);
  if (text === '') return required || min > 0 ? `${label} wajib diisi` : undefined;
  if (text.length < min) return `${label} minimal ${min} karakter`;
  if (max !== undefined && text.length > max) return `${label} maksimal ${max} karakter`;
  if (singleLine && hasControlChars(text)) return `${label} mengandung karakter yang tidak diizinkan`;
  return undefined;
}

// Nama orang: wajib mengandung huruf (menolak "123" atau "!!!")
export function checkPersonName(value, label = 'Nama') {
  const problem = checkText(value, { label, ...LIMITS.PERSON_NAME });
  if (problem) return problem;
  return /\p{L}/u.test(trimmed(value)) ? undefined : `${label} harus mengandung huruf`;
}

export function checkEmail(value, label = 'Email') {
  if (isBlank(value)) return `${label} wajib diisi`;
  if (trimmed(value).length > LIMITS.EMAIL_MAX) return `${label} maksimal ${LIMITS.EMAIL_MAX} karakter`;
  return isValidEmail(value) ? undefined : `Format ${label.toLowerCase()} tidak valid`;
}

export function checkOptionalPhone(value, label = 'Telepon') {
  if (isBlank(value)) return undefined;
  return isValidPhone(value) ? undefined : PHONE_MESSAGE.replace('Nomor telepon', label);
}

export function checkOptionalUrl(value, label = 'URL foto') {
  if (isBlank(value)) return undefined;
  if (trimmed(value).length > LIMITS.URL_MAX) return `${label} maksimal ${LIMITS.URL_MAX} karakter`;
  return isValidHttpUrl(value) ? undefined : `${label} harus URL lengkap yang diawali http:// atau https://`;
}

export function checkInteger(value, { label, min, max }) {
  if (isBlank(value)) return `${label} wajib diisi`;
  const number = toInteger(value);
  if (Number.isNaN(number)) return `${label} harus berupa bilangan bulat`;
  if (number < min || number > max) return `${label} harus antara ${min.toLocaleString('id-ID')} dan ${max.toLocaleString('id-ID')}`;
  return undefined;
}
