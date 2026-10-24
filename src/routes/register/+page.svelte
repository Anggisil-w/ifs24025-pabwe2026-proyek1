<script>
  import { untrack } from 'svelte';
  import { enhance } from '$app/forms';
  import Alert from '#lib/components/Alert.svelte';
  import { withNext } from '#lib/auth/redirect';
  import { LIMITS, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, validateRegister } from '#lib/validators';

  let { data, form } = $props();

  let submitting = $state(false);
  let errors = $state({});
  let name = $state(untrack(() => form?.name ?? ''));
  let email = $state(untrack(() => form?.email ?? ''));
  let password = $state('');
  let confirm = $state('');

  const mismatch = $derived(confirm !== '' && password !== confirm);
  const loginHref = $derived(withNext('/login', data.next));
</script>

<svelte:head>
  <title>Daftar · Mulakjabu</title>
</svelte:head>

<div class="mx-auto max-w-md py-8">
  <div class="card p-6 sm:p-8">
    <h1 class="text-2xl font-bold text-stone-900">Buat akun</h1>
    <p class="mt-1 text-sm text-stone-500">Daftar gratis untuk mulai memesan homestay.</p>

    <form
      method="POST"
      class="mt-6 space-y-4"
      novalidate
      use:enhance={({ cancel }) => {
        errors = validateRegister({ name, email, password, confirm }).errors;
        if (Object.keys(errors).length > 0) return cancel();

        submitting = true;
        return async ({ update }) => {
          await update({ reset: false });
          submitting = false;
        };
      }}
    >
      <Alert error={form?.error} />
      <input type="hidden" name="next" value={data.next} />

      <div>
        <label class="label" for="reg-name">Nama lengkap</label>
        <input id="reg-name" name="name" type="text" class="input" autocomplete="name" maxlength={LIMITS.PERSON_NAME.max} bind:value={name} aria-invalid={errors.name ? 'true' : undefined} />
        {#if errors.name}<p class="field-error">{errors.name}</p>{/if}
      </div>

      <div>
        <label class="label" for="reg-email">Email</label>
        <input id="reg-email" name="email" type="email" class="input" autocomplete="email" maxlength={LIMITS.EMAIL_MAX} bind:value={email} aria-invalid={errors.email ? 'true' : undefined} />
        {#if errors.email}<p class="field-error">{errors.email}</p>{/if}
      </div>

      <div>
        <label class="label" for="reg-password">Password</label>
        <input
          id="reg-password"
          name="password"
          type="password"
          class="input"
          autocomplete="new-password"
          maxlength={PASSWORD_MAX_LENGTH}
          aria-invalid={errors.password ? 'true' : undefined}
          bind:value={password}
        />
        {#if errors.password}
          <p class="field-error">{errors.password}</p>
        {:else}
          <p class="mt-1 text-xs text-stone-500">Minimal {PASSWORD_MIN_LENGTH} karakter.</p>
        {/if}
      </div>

      <div>
        <label class="label" for="reg-confirm">Ulangi password</label>
        <input
          id="reg-confirm"
          name="confirm"
          type="password"
          class="input"
          autocomplete="new-password"
          maxlength={PASSWORD_MAX_LENGTH}
          aria-invalid={mismatch || errors.confirm ? 'true' : undefined}
          bind:value={confirm}
        />
        {#if mismatch || errors.confirm}<p class="field-error">Password tidak cocok</p>{/if}
      </div>

      <button type="submit" class="btn btn-primary w-full" disabled={submitting}>
        {submitting ? 'Memproses…' : 'Daftar'}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-stone-600">
      Sudah punya akun?
      <a href={loginHref} class="font-semibold text-brand-700 hover:underline">Masuk</a>
    </p>
  </div>
</div>