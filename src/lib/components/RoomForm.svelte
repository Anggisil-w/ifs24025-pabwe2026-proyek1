<script>
  import Alert from './Alert.svelte';
  import { createRoom, updateRoom } from '#lib/api';
  import { createSubmitter } from '#lib/submit.svelte.js';
  import { LIMITS, validateRoom } from '#lib/validators';

  // room = null -> mode tambah; room = objek -> mode ubah. homestays dipakai untuk pilihan pemilik kamar.
  let { room = null, homestays, defaultHomestayId = '', onsaved, oncancel } = $props();

  const isEdit = $derived(room !== null);

  // Saran jenis kamar (input tetap bebas diketik)
  const roomTypes = ['standard', 'family', 'suite', 'deluxe', 'superior', 'economy', 'cottage', 'bungalow'];

  function buildInitial() {
    return {
      homestay_id: String(room?.homestay_id ?? defaultHomestayId ?? ''),
      name: room?.name ?? '',
      type: room?.type ?? '',
      capacity: room?.capacity ?? 2,
      price_per_night: room?.price_per_night ?? '',
      description: room?.description ?? '',
      is_active: room ? room.is_active : true
    };
  }

  let form = $state(buildInitial());
  let submitted = $state(false);
  const submit = createSubmitter(); // status simpan + error API + toast gagal

  // Aturan sama dengan server dan backend; error tampil setelah percobaan kirim pertama lalu ikut diperbarui saat mengetik
  const checked = $derived(validateRoom(form));
  const errors = $derived(submitted ? checked.errors : {});

  async function handleSubmit(event) {
    event.preventDefault();
    submit.clearError();
    submitted = true;
    if (!checked.valid) return;

    // PUT backend mengganti seluruh data, jadi is_active selalu ikut dikirim (sudah ada di checked.data)
    const payload = checked.data;
    const result = await submit.run(() => (isEdit ? updateRoom(room.id, payload) : createRoom(payload)));
    if (result.ok) onsaved?.(result.value);
  }
</script>

<form class="space-y-4" onsubmit={handleSubmit} novalidate>
  <Alert error={submit.error} />

  <div>
    <label class="label" for="room-homestay">Homestay</label>
    <select id="room-homestay" class="input" bind:value={form.homestay_id} aria-invalid={errors.homestay_id ? 'true' : undefined}>
      <option value="">-- Pilih homestay --</option>
      {#each homestays as homestay (homestay.id)}
        <option value={String(homestay.id)}>{homestay.name} ({homestay.city})</option>
      {/each}
    </select>
    {#if errors.homestay_id}<p class="field-error">{errors.homestay_id}</p>{/if}
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label class="label" for="room-name">Nama kamar</label>
      <input id="room-name" class="input" type="text" bind:value={form.name} maxlength={LIMITS.ROOM_NAME.max} aria-invalid={errors.name ? 'true' : undefined} placeholder="Mis. Kamar Standar Danau" />
      {#if errors.name}<p class="field-error">{errors.name}</p>{/if}
    </div>
    <div>
      <label class="label" for="room-type">Jenis</label>
      <input id="room-type" class="input" type="text" list="room-type-list" bind:value={form.type} maxlength={LIMITS.ROOM_TYPE.max} aria-invalid={errors.type ? 'true' : undefined} placeholder="Mis. standard" />
      <datalist id="room-type-list">
        {#each roomTypes as type}
          <option value={type}></option>
        {/each}
      </datalist>
      {#if errors.type}<p class="field-error">{errors.type}</p>{/if}
    </div>
  </div>

  <div class="grid gap-4 sm:grid-cols-2">
    <div>
      <label class="label" for="room-capacity">Kapasitas (tamu)</label>
      <input id="room-capacity" class="input" type="number" inputmode="numeric" min={LIMITS.CAPACITY.min} max={LIMITS.CAPACITY.max} step="1" bind:value={form.capacity} aria-invalid={errors.capacity ? 'true' : undefined} />
      {#if errors.capacity}<p class="field-error">{errors.capacity}</p>{/if}
    </div>
    <div>
      <label class="label" for="room-price">Harga per malam (Rp)</label>
      <input id="room-price" class="input" type="number" inputmode="numeric" min={LIMITS.PRICE.min} max={LIMITS.PRICE.max} step="1000" bind:value={form.price_per_night} aria-invalid={errors.price_per_night ? 'true' : undefined} placeholder="250000" />
      {#if errors.price_per_night}<p class="field-error">{errors.price_per_night}</p>{/if}
    </div>
  </div>

  <div>
    <label class="label" for="room-description">Deskripsi (opsional)</label>
    <textarea id="room-description" class="input" rows="3" bind:value={form.description} maxlength={LIMITS.DESCRIPTION_MAX} aria-invalid={errors.description ? 'true' : undefined}></textarea>
    {#if errors.description}<p class="field-error">{errors.description}</p>{/if}
  </div>

  <label class="flex items-center gap-2 text-sm text-stone-700">
    <input type="checkbox" class="h-4 w-4 rounded-sm border-stone-300 text-brand-600" bind:checked={form.is_active} />
    Kamar aktif (dapat dipesan)
  </label>

  <div class="flex justify-end gap-3 pt-2">
    <button type="button" class="btn btn-secondary" onclick={oncancel} disabled={submit.saving}>Batal</button>
    <button type="submit" class="btn btn-primary" disabled={submit.saving}>
      {submit.saving ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Tambah kamar'}
    </button>
  </div>
</form>
