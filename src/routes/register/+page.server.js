import { fail, redirect } from '@sveltejs/kit';
import { register, toErrorInfo } from '#lib/api';
import { safeNext } from '#lib/auth/redirect';
import { setSessionCookie } from '#lib/server/auth/cookie';
import { redirectIfAuthenticated } from '#lib/server/auth/guards';
import { validateRegister } from '#lib/validators';

// Sudah login -> langsung ke tujuan (?next=); selain itu tampilkan form
export const load = redirectIfAuthenticated;

export const actions = {
  default: async ({ request, cookies, url, fetch }) => {
    const form = await request.formData();
    const next = safeNext(form.get('next'));

    // Validasi ulang di server (validasi klien bisa dilewati)
    const { valid, errors, data } = validateRegister({
      name: form.get('name'),
      email: form.get('email'),
      password: form.get('password'),
      confirm: form.get('confirm')
    });
    const echo = { name: data.name, email: data.email }; // dikembalikan agar form tetap terisi (tanpa password)
    if (!valid) {
      const details = Object.entries(errors).map(([field, message]) => ({ field, message }));
      return fail(400, { ...echo, error: { message: 'Data pendaftaran belum valid', details } });
    }

    try {
      // Setelah daftar, langsung masuk (backend mengembalikan token yang sama seperti login)
      const { token } = await register(data, { fetch });
      setSessionCookie(cookies, token, url);
    } catch (err) {
      const error = toErrorInfo(err);
      return fail(error.status >= 400 ? error.status : 503, { ...echo, error });
    }
    redirect(303, next);
  }
};
