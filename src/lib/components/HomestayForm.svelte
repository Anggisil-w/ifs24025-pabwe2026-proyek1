<script>
  import Alert from './Alert.svelte';
  import { createHomestay, updateHomestay } from '#lib/api';
  import { createSubmitter } from '#lib/submit.svelte.js';
  import { LIMITS, validateHomestay } from '#lib/validators';

  // homestay = null -> mode tambah; homestay = objek -> mode ubah
  let { homestay = null, onsaved, oncancel } = $props();

  const isEdit = $derived(homestay !== null);

  function buildInitial() {
    return {
      name: homestay?.name ?? '',
      city: homestay?.city ?? '',
      address: homestay?.address ?? '',
      phone: homestay?.phone ?? '',
      image_url: homestay?.image_url ?? '',
      description: homestay?.description ?? ''
    };
  }

  let form = $state(buildInitial());
  let submitted = $state(false);
  const submit = createSubmitter(); // status simpan + error API + toast gagal

  // Validasi sisi klien (aturan sama dengan server action) untuk umpan balik cepat; backend tetap penentu akhir.
  // Error baru ditampilkan setelah percobaan kirim pertama, lalu ikut diperbarui saat pengguna mengetik.
  const checked = $derived(validateHomestay(form));
  const errors = $derived(submitted ? checked.errors : {});

  async function handleSubmit(event) {
    event.preventDefault();
    submit.clearError();
    submitted = true;
    if (!checked.valid) return;

    const payload = checked.data;
    const result = await submit.run(() => (isEdit ? updateHomestay(homestay.id, payload) : createHomestay(payload)));
    if (result.ok) onsaved?.(result.value);
  }
</script>

<form class="space-y-4" onsubmit={handleSubmit} novalidate>
  <Alert error={submit.error} />

  <div>
    <label class="label" for="hs-name">Nama homestay</label>
    <input id="hs-name" class="input" type="text" bind:value={form.name} maxlength={LIMITS.HOMESTAY_NAME.max} placeholder="Mis. Homestay Tepi Toba" aria-invalid={errors.name ? 'true' : undefined} aria-describedby={errors.name ? 'hs-name-error' : undefined} />
    {#if errors.name}<p id="hs-name-error" class="field-error">{errors.name}</p>{/if}
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label class="label" for="hs-city">Kota</label>
      <input id="hs-city" class="input" type="text" bind:value={form.city} maxlength={LIMITS.CITY_MAX} placeholder="Mis. Parapat" aria-invalid={errors.city ? 'true' : undefined} aria-describedby={errors.city ? 'hs-city-error' : undefined} />
      {#if errors.city}<p id="hs-city-error" class="field-error">{errors.city}</p>{/if}
    </div>
    <div>
      <label class="label" for="hs-phone">Telepon (opsional)</label>
      <input id="hs-phone" class="input" type="tel" inputmode="tel" bind:value={form.phone} maxlength="20" autocomplete="off" placeholder="081234567890" aria-invalid={errors.phone ? 'true' : undefined} aria-describedby={errors.phone ? 'hs-phone-error' : undefined} />
      {#if errors.phone}<p id="hs-phone-error" class="field-error">{errors.phone}</p>{/if}
    </div>
  </div>

  <div>
    <label class="label" for="hs-address">Alamat</label>
    <input id="hs-address" class="input" type="text" bind:value={form.address} maxlength={LIMITS.ADDRESS_MAX} placeholder="Jl. Pelabuhan No. 12" aria-invalid={errors.address ? 'true' : undefined} aria-describedby={errors.address ? 'hs-address-error' : undefined} />
    {#if errors.address}<p id="hs-address-error" class="field-error">{errors.address}</p>{/if}
  </div>

  <div>
    <label class="label" for="hs-image">URL foto (opsional)</label>
    <input id="hs-image" class="input" type="url" bind:value={form.image_url} maxlength={LIMITS.URL_MAX} placeholder="https://..." aria-invalid={errors.image_url ? 'true' : undefined} aria-describedby={errors.image_url ? 'hs-image-error' : undefined} />
    {#if errors.image_url}<p id="hs-image-error" class="field-error">{errors.image_url}</p>{/if}
  </div>

  <div>
    <label class="label" for="hs-description">Deskripsi (opsional)</label>
    <textarea id="hs-description" class="input" rows="3" bind:value={form.description} maxlength={LIMITS.DESCRIPTION_MAX} aria-invalid={errors.description ? 'true' : undefined} aria-describedby={errors.description ? 'hs-description-error' : undefined}></textarea>
    {#if errors.description}<p id="hs-description-error" class="field-error">{errors.description}</p>{/if}
  </div>

  <div class="flex justify-end gap-3 pt-2">
    <button type="button" class="btn btn-secondary" onclick={oncancel} disabled={submit.saving}>Batal</button>
    <button type="submit" class="btn btn-primary" disabled={submit.saving}>
      {submit.saving ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Tambah homestay'}
    </button>
  </div>
</form>
