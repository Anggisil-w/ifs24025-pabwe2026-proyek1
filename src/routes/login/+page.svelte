<script>
  import { enhance } from '$app/forms';
  import Alert from '#lib/components/Alert.svelte';
  import { withNext } from '#lib/auth/redirect';
  import { LIMITS, validateLogin } from '#lib/validators';

  let { data, form } = $props();

  let submitting = $state(false);
  let errors = $state({});
  const registerHref = $derived(withNext('/register', data.next));
</script>

<svelte:head>
  <title>Masuk · Mulakjabu</title>
</svelte:head>

<div class="mx-auto max-w-md py-8">
  <div class="card p-6 sm:p-8">
    <h1 class="text-2xl font-bold text-stone-900">Masuk</h1>
    <p class="mt-1 text-sm text-stone-500">Masuk untuk memesan dan melihat pesananmu.</p>

    <form
      method="POST"
      class="mt-6 space-y-4"
      novalidate
      use:enhance={({ formData, cancel }) => {
        // Validasi di klien dulu agar pengguna langsung melihat field mana yang salah
        errors = validateLogin({ email: formData.get('email'), password: formData.get('password') }).errors;
        if (Object.keys(errors).length > 0) return cancel();

        submitting = true;
        return async ({ update }) => {
          await update({ reset: false }); // email tetap terisi saat gagal
          submitting = false;
        };
      }}
    >
      <Alert error={form?.error} />
      <input type="hidden" name="next" value={data.next} />

      <div>
        <label class="label" for="username">Email</label>
        <input
          id="username"
          name="email"
          type="email"
          class="input"
          autocomplete="email"
          maxlength={LIMITS.EMAIL_MAX}
          value={form?.email ?? ''}
          aria-invalid={errors.email ? 'true' : undefined}
        />
        {#if errors.email}<p class="field-error">{errors.email}</p>{/if}
      </div>

      <div>
        <label class="label" for="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          class="input"
          autocomplete="current-password"
          maxlength={LIMITS.PASSWORD.max}
          aria-invalid={errors.password ? 'true' : undefined}
        />
        {#if errors.password}<p class="field-error">{errors.password}</p>{/if}
      </div>

      <button id="btn-submit" type="submit" class="btn btn-primary w-full" disabled={submitting}>
        {submitting ? 'Memproses…' : 'Masuk'}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-stone-600">
      Belum punya akun?
      <a href={registerHref} class="font-semibold text-brand-700 hover:underline">Daftar</a>
    </p>
  </div>
</div>
