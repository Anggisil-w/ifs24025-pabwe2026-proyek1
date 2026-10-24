<script>
  import { page } from '$app/state';
  import Alert from '#lib/components/Alert.svelte';
  import Badge from '#lib/components/Badge.svelte';
  import { createBooking } from '#lib/api';
  import { createSubmitter } from '#lib/submit.svelte.js';
  import { formatRupiah, formatDate, countNights, todayISO } from '#lib/format';
  import { useSession } from '#lib/auth/session';
  import { LIMITS, validateBooking } from '#lib/validators';

  let { data } = $props();
  const session = useSession();

  // Nama dan email diisi dari akun yang sedang login (masih bisa diubah, mis. memesan untuk orang lain)
  const emptyForm = () => ({
    guest_name: session.user?.name ?? '',
    guest_email: session.user?.email ?? '',
    guest_phone: '',
    guests_count: 1,
    check_in: '',
    check_out: ''
  });

  let roomId = $state('');
  let form = $state(emptyForm());
  let submitted = $state(false);
  const submit = createSubmitter(); // status kirim + error API + toast gagal
  let created = $state(null);

  // Check-in tidak boleh di masa lalu (batasan UX di form; backend tidak membatasi)
  const today = todayISO();

  // Hanya kamar aktif yang bisa dipesan
  const activeRooms = $derived(data.rooms.filter((room) => room.is_active));
  const selectedRoom = $derived(activeRooms.find((room) => String(room.id) === String(roomId)) ?? null);

  // Ringkasan biaya dihitung langsung di UI. Total resmi tetap dihitung server saat pemesanan dibuat.
  const nights = $derived(countNights(form.check_in, form.check_out));
  const total = $derived(selectedRoom && nights > 0 ? nights * selectedRoom.price_per_night : 0);
  const guestsOverCapacity = $derived(selectedRoom !== null && Number(form.guests_count) > selectedRoom.capacity);

  // Tombol "Pesan kamar ini": pilih kamar lalu gulir ke form
  function chooseRoom(room) {
    roomId = String(room.id);
    created = null;
    submit.clearError();
    document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Aturan yang sama dipakai backend (kapasitas, tanggal kalender nyata, check-out setelah check-in).
  // Error tampil setelah percobaan kirim pertama, lalu ikut diperbarui saat pengguna mengetik.
  const checked = $derived(validateBooking({ ...form }, { room: selectedRoom, today }));
  const errors = $derived(submitted ? checked.errors : {});

  async function handleSubmit(event) {
    event.preventDefault();
    submit.clearError();
    created = null;
    submitted = true;
    if (!checked.valid) return;

    // total_price sengaja tidak dikirim: dihitung oleh server.
    // Error 400 (kapasitas/validasi), 404, atau 409 (tanggal bentrok) ditampilkan lengkap dengan details.
    const payload = checked.data;
    const result = await submit.run(() => createBooking(payload));
    if (result.ok) {
      created = result.value;
      form = emptyForm();
      submitted = false;
    }
  }
</script>

<svelte:head>
  <title>{data.homestay.name} · Mulakjabu</title>
</svelte:head>

<nav class="mb-4 text-sm text-stone-500" aria-label="Breadcrumb">
  <a href="/" class="hover:text-brand-700">← Kembali ke katalog</a>
</nav>

<div class="grid gap-8 lg:grid-cols-3">
  <!-- Kolom kiri: informasi homestay dan daftar kamar -->
  <div class="space-y-8 lg:col-span-2">
    <section class="card overflow-hidden">
      <div class="relative h-64 bg-gradient-to-br from-brand-100 to-brand-300 sm:h-80">
        <div class="absolute inset-0 flex items-center justify-center text-7xl" aria-hidden="true">🏡</div>
        {#if data.homestay.image_url}
          <img
            src={data.homestay.image_url}
            alt={data.homestay.name}
            class="absolute inset-0 h-full w-full object-cover"
            onerror={(event) => (event.currentTarget.style.display = 'none')}
          />
        {/if}
      </div>
      <div class="space-y-3 p-6">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-2xl font-bold text-stone-900">{data.homestay.name}</h1>
          <span class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{data.homestay.city}</span>
        </div>
        <p class="text-stone-600">📍 {data.homestay.address}</p>
        {#if data.homestay.phone}
          <p class="text-stone-600">📞 {data.homestay.phone}</p>
        {/if}
        {#if data.homestay.description}
          <p class="leading-relaxed text-stone-700">{data.homestay.description}</p>
        {/if}
      </div>
    </section>

    <section>
      <h2 class="mb-4 text-xl font-semibold text-stone-900">Kamar tersedia</h2>
      {#if activeRooms.length === 0}
        <div class="card px-6 py-8 text-center text-stone-500">Belum ada kamar aktif di homestay ini.</div>
      {:else}
        <div class="grid gap-4 sm:grid-cols-2">
          {#each activeRooms as room (room.id)}
            <article
              class="card flex flex-col p-5 {String(room.id) === String(roomId) ? 'ring-2 ring-brand-500' : ''}"
            >
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-semibold text-stone-900">{room.name}</h3>
                <span class="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium capitalize text-stone-600">{room.type}</span>
              </div>
              {#if room.description}
                <p class="mt-2 text-sm text-stone-600">{room.description}</p>
              {/if}
              <p class="mt-2 text-sm text-stone-500">👥 Maksimal {room.capacity} tamu</p>
              <div class="mt-auto flex items-end justify-between gap-3 pt-4">
                <p class="font-semibold text-brand-700">
                  {formatRupiah(room.price_per_night)}<span class="text-sm font-normal text-stone-500"> / malam</span>
                </p>
                <button type="button" class="btn btn-primary btn-sm" onclick={() => chooseRoom(room)}>
                  {String(room.id) === String(roomId) ? 'Terpilih' : 'Pesan kamar ini'}
                </button>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    </section>
  </div>

  <!-- Kolom kanan: form pemesanan -->
  <aside id="booking-form" class="lg:sticky lg:top-24 lg:self-start">
    <div class="card p-6">
      <h2 class="text-xl font-semibold text-stone-900">Form pemesanan</h2>

      {#if activeRooms.length === 0}
        <p class="mt-3 text-sm text-stone-500">Pemesanan belum tersedia karena tidak ada kamar aktif.</p>
      {:else if !data.user}
        <p class="mt-3 text-sm text-stone-600">Masuk atau daftar terlebih dahulu untuk memesan kamar.</p>
        <div class="mt-4 flex gap-2">
          <a href={`/login?next=${encodeURIComponent(page.url.pathname)}`} class="btn btn-primary flex-1">Masuk</a>
          <a href={`/register?next=${encodeURIComponent(page.url.pathname)}`} class="btn btn-secondary flex-1">Daftar</a>
        </div>
      {:else}
        <form class="mt-4 space-y-4" onsubmit={handleSubmit} novalidate>
          {#if created}
            <div class="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
              <p class="font-semibold">Pesanan #{created.id} berhasil dibuat</p>
              <p>
                {formatDate(created.check_in)} – {formatDate(created.check_out)} · total {formatRupiah(created.total_price)}
              </p>
              <p class="flex items-center gap-2">Status: <Badge status={created.status} /></p>
              <a href="/bookings" class="inline-block font-semibold underline">Lihat daftar pesanan</a>
            </div>
          {/if}

          <Alert error={submit.error} />

          <div>
            <label class="label" for="bk-room">Kamar</label>
            <select id="bk-room" class="input" bind:value={roomId} aria-invalid={errors.room ? 'true' : undefined}>
              <option value="">-- Pilih kamar --</option>
              {#each activeRooms as room (room.id)}
                <option value={String(room.id)}>{room.name} · {formatRupiah(room.price_per_night)}</option>
              {/each}
            </select>
            {#if errors.room}<p class="field-error">{errors.room}</p>{/if}
          </div>

          <div>
            <label class="label" for="bk-name">Nama tamu</label>
            <input id="bk-name" class="input" type="text" bind:value={form.guest_name} maxlength={LIMITS.PERSON_NAME.max} autocomplete="name" aria-invalid={errors.guest_name ? 'true' : undefined} />
            {#if errors.guest_name}<p class="field-error">{errors.guest_name}</p>{/if}
          </div>

          <div>
            <label class="label" for="bk-email">Email</label>
            <input id="bk-email" class="input" type="email" bind:value={form.guest_email} maxlength={LIMITS.EMAIL_MAX} autocomplete="email" aria-invalid={errors.guest_email ? 'true' : undefined} />
            {#if errors.guest_email}<p class="field-error">{errors.guest_email}</p>{/if}
          </div>

          <div>
            <label class="label" for="bk-phone">Telepon (opsional)</label>
            <input id="bk-phone" class="input" type="tel" inputmode="tel" bind:value={form.guest_phone} maxlength="20" autocomplete="tel" aria-invalid={errors.guest_phone ? 'true' : undefined} />
            {#if errors.guest_phone}<p class="field-error">{errors.guest_phone}</p>{/if}
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label" for="bk-in">Check-in</label>
              <input id="bk-in" class="input" type="date" min={today} bind:value={form.check_in} aria-invalid={errors.check_in ? 'true' : undefined} />
              {#if errors.check_in}<p class="field-error">{errors.check_in}</p>{/if}
            </div>
            <div>
              <label class="label" for="bk-out">Check-out</label>
              <input id="bk-out" class="input" type="date" min={form.check_in || today} bind:value={form.check_out} aria-invalid={errors.check_out ? 'true' : undefined} />
              {#if errors.check_out}<p class="field-error">{errors.check_out}</p>{/if}
            </div>
          </div>

          <div>
            <label class="label" for="bk-guests">
              Jumlah tamu
              {#if selectedRoom}<span class="font-normal text-stone-500">(maks. {selectedRoom.capacity})</span>{/if}
            </label>
            <input
              id="bk-guests"
              class="input"
              type="number"
              inputmode="numeric"
              step="1"
              min={LIMITS.GUESTS.min}
              max={selectedRoom ? selectedRoom.capacity : LIMITS.GUESTS.max}
              bind:value={form.guests_count}
              aria-invalid={errors.guests_count ? 'true' : undefined}
            />
            {#if errors.guests_count}
              <p class="field-error">{errors.guests_count}</p>
            {:else if guestsOverCapacity}
              <p class="field-error">Kapasitas kamar ini maksimal {selectedRoom.capacity} tamu</p>
            {/if}
          </div>

          <!-- Ringkasan biaya (hitung otomatis di UI) -->
          <div class="space-y-1 rounded-lg bg-stone-50 p-4 text-sm">
            <div class="flex justify-between">
              <span class="text-stone-500">Harga per malam</span>
              <span>{selectedRoom ? formatRupiah(selectedRoom.price_per_night) : '-'}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-stone-500">Durasi</span>
              <span>{nights > 0 ? `${nights} malam` : '-'}</span>
            </div>
            <div class="flex justify-between border-t border-stone-200 pt-2 text-base font-semibold text-stone-900">
              <span>Total</span>
              <span class="text-brand-700">{total > 0 ? formatRupiah(total) : '-'}</span>
            </div>
          </div>

          <button type="submit" class="btn btn-primary w-full" disabled={submit.saving}>
            {submit.saving ? 'Memproses…' : 'Pesan sekarang'}
          </button>
        </form>
      {/if}
    </div>
  </aside>
</div>
