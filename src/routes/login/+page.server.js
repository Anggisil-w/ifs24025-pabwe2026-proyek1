import { fail, redirect } from '@sveltejs/kit';
import { login, toErrorInfo } from '#lib/api';
import { safeNext } from '#lib/auth/redirect';
import { setSessionCookie } from '#lib/server/auth/cookie';
import { redirectIfAuthenticated } from '#lib/server/auth/guards';
import { validateLogin } from '#lib/validators';

// Sudah login -> langsung ke tujuan (?next=); selain itu tampilkan form
export const load = redirectIfAuthenticated;

export const actions = {
  default: async ({ request, cookies, url, fetch }) => {
    const form = await request.formData();
    const next = safeNext(form.get('next'));

    // Validasi ulang di server (validasi klien bisa dilewati)
    const { valid, errors, data } = validateLogin({ email: form.get('email'), password: form.get('password') });
    const email = data.email;
    if (!valid) {
      const details = Object.entries(errors).map(([field, message]) => ({ field, message }));
      return fail(400, { email, error: { message: 'Data login belum valid', details } });
    }

    try {
      const { token } = await login(data, { fetch });
      setSessionCookie(cookies, token, url);
    } catch (err) {
      const error = toErrorInfo(err);
      return fail(error.status >= 400 ? error.status : 503, { email, error });
    }
    redirect(303, next);
  }
};
