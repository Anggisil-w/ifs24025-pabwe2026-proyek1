// Validator per form. Setiap fungsi mengembalikan:
//   { valid, errors, data }
// - errors: { namaField: pesan } (kosong jika valid)
// - data:   payload yang sudah dinormalisasi (di-trim, kolom opsional kosong -> null) dan siap dikirim ke API.
//           Hanya bermakna jika valid === true.
//
// Fungsi yang sama dipakai di komponen form (umpan balik langsung) dan di server action
// (validasi ulang karena validasi klien bisa dilewati), sehingga aturannya tidak pernah berbeda.
import {
  LIMITS,
  checkEmail,
  checkInteger,
  checkOptionalPhone,
  checkOptionalUrl,
  checkPersonName,
  checkText,
  isBlank,
  isValidIsoDate,
  toInteger,
  toText,
  trimmed
} from './rules.js';

const PASSWORD_MIN_LENGTH = LIMITS.PASSWORD.min;
const PASSWORD_MAX_LENGTH = LIMITS.PASSWORD.max;
export { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH };

const orNull = (value) => trimmed(value) || null;

// Mengumpulkan pesan error; field tanpa masalah (undefined) dilewati
function collect(checks) {
  const errors = {};
  for (const [field, message] of Object.entries(checks)) {
    if (message) errors[field] = message;
  }
  return errors;
}

const result = (errors, data) => ({ valid: Object.keys(errors).length === 0, errors, data });

// ---------- Autentikasi ----------

function loginPasswordProblem(pass) {
  if (pass === '') return 'Password wajib diisi';
  if (pass.length > PASSWORD_MAX_LENGTH) return `Password maksimal ${PASSWORD_MAX_LENGTH} karakter`;
  return undefined;
}

export function validateLogin({ email, password } = {}) {
  const pass = toText(password);
  const errors = collect({
    email: checkEmail(email),
    password: loginPasswordProblem(pass)
  });
  return result(errors, { email: trimmed(email).toLowerCase(), password: pass });
}

export function validateRegister({ name, email, password, confirm } = {}) {
  const pass = toText(password);
  let passwordProblem;
  if (pass.length < PASSWORD_MIN_LENGTH) passwordProblem = `Password minimal ${PASSWORD_MIN_LENGTH} karakter`;
  else if (pass.length > PASSWORD_MAX_LENGTH) passwordProblem = `Password maksimal ${PASSWORD_MAX_LENGTH} karakter`;
  else if (pass.trim() === '') passwordProblem = 'Password tidak boleh hanya berisi spasi';

  const errors = collect({
    name: checkPersonName(name, 'Nama'),
    email: checkEmail(email),
    password: passwordProblem,
    confirm: pass === toText(confirm) ? undefined : 'Password tidak cocok'
  });
  return result(errors, { name: trimmed(name), email: trimmed(email).toLowerCase(), password: pass });
}

// ---------- Homestay (admin) ----------

export function validateHomestay({ name, city, address, phone, image_url, description } = {}) {
  const errors = collect({
    name: checkText(name, { label: 'Nama', ...LIMITS.HOMESTAY_NAME }),
    city: checkText(city, { label: 'Kota', max: LIMITS.CITY_MAX }),
    address: checkText(address, { label: 'Alamat', max: LIMITS.ADDRESS_MAX }),
    phone: checkOptionalPhone(phone),
    image_url: checkOptionalUrl(image_url),
    description: checkText(description, {
      label: 'Deskripsi',
      required: false,
      max: LIMITS.DESCRIPTION_MAX,
      singleLine: false
    })
  });
  // Kolom opsional yang dikosongkan dikirim sebagai null
  return result(errors, {
    name: trimmed(name),
    city: trimmed(city),
    address: trimmed(address),
    phone: orNull(phone),
    image_url: orNull(image_url),
    description: orNull(description)
  });
}

// ---------- Kamar (admin) ----------

function homestayIdProblem(value) {
  if (isBlank(value)) return 'Pilih homestay pemilik kamar';
  return toInteger(value) >= 1 ? undefined : 'Homestay tidak valid';
}

export function validateRoom({ homestay_id, name, type, capacity, price_per_night, description, is_active } = {}) {
  const errors = collect({
    homestay_id: homestayIdProblem(homestay_id),
    name: checkText(name, { label: 'Nama kamar', ...LIMITS.ROOM_NAME }),
    type: checkText(type, { label: 'Jenis kamar', ...LIMITS.ROOM_TYPE }),
    capacity: checkInteger(capacity, { label: 'Kapasitas', ...LIMITS.CAPACITY }),
    price_per_night: checkInteger(price_per_night, { label: 'Harga', ...LIMITS.PRICE }),
    description: checkText(description, {
      label: 'Deskripsi',
      required: false,
      max: LIMITS.DESCRIPTION_MAX,
      singleLine: false
    })
  });
  return result(errors, {
    homestay_id: toInteger(homestay_id),
    name: trimmed(name),
    type: trimmed(type),
    capacity: toInteger(capacity),
    price_per_night: toInteger(price_per_night),
    description: orNull(description),
    // PUT backend mengganti seluruh data, jadi is_active selalu dikirim
    is_active: is_active !== false
  });
}

// ---------- Pemesanan ----------

// context.room: kamar terpilih (untuk cek kapasitas); context.today: 'YYYY-MM-DD' (WIB) untuk batas check-in.
export function validateBooking(input = {}, { room = null, today = null } = {}) {
  const { guest_name, guest_email, guest_phone, guests_count, check_in, check_out } = input;

  let guestsProblem = checkInteger(guests_count, { label: 'Jumlah tamu', ...LIMITS.GUESTS });
  if (!guestsProblem && room && toInteger(guests_count) > room.capacity) {
    guestsProblem = `Kapasitas kamar ini maksimal ${room.capacity} tamu`;
  }

  let checkInProblem;
  if (isBlank(check_in)) checkInProblem = 'Tanggal check-in wajib diisi';
  else if (!isValidIsoDate(check_in)) checkInProblem = 'Tanggal check-in tidak valid';
  else if (today && check_in < today) checkInProblem = 'Check-in tidak boleh sebelum hari ini';

  let checkOutProblem;
  if (isBlank(check_out)) checkOutProblem = 'Tanggal check-out wajib diisi';
  else if (!isValidIsoDate(check_out)) checkOutProblem = 'Tanggal check-out tidak valid';
  else if (!checkInProblem && check_out <= check_in) checkOutProblem = 'Check-out harus setelah check-in';

  const errors = collect({
    room: room ? undefined : 'Pilih kamar terlebih dahulu',
    guest_name: checkPersonName(guest_name, 'Nama'),
    guest_email: checkEmail(guest_email),
    guest_phone: checkOptionalPhone(guest_phone),
    guests_count: guestsProblem,
    check_in: checkInProblem,
    check_out: checkOutProblem
  });
  // total_price sengaja tidak ada: dihitung server
  return result(errors, {
    room_id: room?.id ?? null,
    guest_name: trimmed(guest_name),
    guest_email: trimmed(guest_email).toLowerCase(),
    guest_phone: orNull(guest_phone),
    guests_count: toInteger(guests_count),
    check_in: trimmed(check_in),
    check_out: trimmed(check_out)
  });
}
