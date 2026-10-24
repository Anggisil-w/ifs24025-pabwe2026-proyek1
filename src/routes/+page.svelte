<script>
  import Alert from '#lib/components/Alert.svelte';
  import EmptyState from '#lib/components/EmptyState.svelte';
  import HomestayImage from '#lib/components/HomestayImage.svelte';
  import { formatRupiah } from '#lib/format';

  let { data } = $props();

  // Kunci untuk membuat ulang form saat filter di URL berubah (mis. setelah klik "Reset")
  const filterKey = $derived(`${data.filters.search}|${data.filters.city}`);

  // Rentang nomor halaman yang ditampilkan (maksimal 5 tombol)
  const pageNumbers = $derived.by(() => {
    const { page, totalPages } = data.pagination;
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });

  const firstItem = $derived((data.pagination.page - 1) * data.pagination.limit + 1);
  const lastItem = $derived(firstItem + data.homestays.length - 1);
  const hasFilter = $derived(Boolean(data.filters.search || data.filters.city));

  // Tautan halaman dengan mempertahankan filter
  function pageHref(pageNumber) {
    const params = new URLSearchParams();
    if (data.filters.search) params.set('search', data.filters.search);
    if (data.filters.city) params.set('city', data.filters.city);
    if (pageNumber > 1) params.set('page', String(pageNumber));
    const query = params.toString();
    return query ? `/?${query}` : '/';
  }
</script>

<svelte:head>
  <title>Katalog Homestay · Mulakjabu</title>
</svelte:head>

<section class="mb-8 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-10 text-white sm:px-10">
  <h1 class="text-3xl font-bold sm:text-4xl">Menginap lokal, rasa pulang</h1>
  <p class="mt-2 max-w-2xl text-brand-50">
    Temukan homestay di Sumatera Utara: dari tepi Danau Toba, rumah adat Samosir, hingga hutan Bukit Lawang.
  </p>

  {#key filterKey}
    <form method="GET" action="/" class="mt-6 grid gap-3 sm:grid-cols-[1fr_14rem_auto]">
      <label class="sr-only" for="search">Cari homestay</label>
      <input
        id="search"
        name="search"
        type="search"
        class="input"
        placeholder="Cari nama, alamat, atau deskripsi…"
        value={data.filters.search}
      />

      <label class="sr-only" for="city">Kota</label>
      <select
        id="city"
        name="city"
        class="input"
        value={data.filters.city}
        onchange={(event) => event.currentTarget.form.requestSubmit()}
      >
        <option value="">Semua kota</option>
        {#each data.cities as city (city)}
          <option value={city}>{city}</option>
        {/each}
      </select>

      <div class="flex gap-2">
        <button type="submit" class="btn bg-white text-brand-700 hover:bg-brand-50">Cari</button>
        {#if hasFilter}
          <a href="/" class="btn border border-white/60 text-white hover:bg-white/10">Reset</a>
        {/if}
      </div>
    </form>
  {/key}
</section>

{#if data.loadError}
  <Alert error={data.loadError} />
{:else if data.homestays.length === 0}
  <EmptyState
    title="Tidak ada homestay yang cocok"
    description="Coba ubah kata kunci atau pilih kota lain."
    actionHref={hasFilter || data.filters.page > 1 ? '/' : ''}
    actionLabel="Tampilkan semua homestay"
  />
{:else}
  <p class="mb-4 text-sm text-stone-500">
    Menampilkan {firstItem}–{lastItem} dari {data.pagination.total} homestay
  </p>

  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {#each data.homestays as homestay (homestay.id)}
      <article class="card flex flex-col overflow-hidden">
        <HomestayImage src={homestay.image_url ?? ''} alt={homestay.name} lazy class="h-44">
          <span class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            {homestay.city}
          </span>
        </HomestayImage>

        <div class="flex flex-1 flex-col p-5">
          <h2 class="text-lg font-semibold text-stone-900">{homestay.name}</h2>
          <p class="mt-1 text-sm text-stone-600">📍 {homestay.address}</p>
          {#if homestay.phone}
            <p class="mt-1 text-sm text-stone-600">📞 {homestay.phone}</p>
          {/if}

          <div class="mt-auto flex items-end justify-between gap-3 pt-4">
            <div class="text-sm">
              {#if homestay.min_price_per_night != null}
                <span class="text-stone-500">Mulai dari</span>
                <p class="font-semibold text-brand-700">{formatRupiah(homestay.min_price_per_night)}<span class="font-normal text-stone-500"> / malam</span></p>
              {/if}
            </div>
            <a href="/homestays/{homestay.id}" class="btn btn-primary">Lihat detail</a>
          </div>
        </div>
      </article>
    {/each}
  </div>

  {#if data.pagination.totalPages > 1}
    <nav class="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {#if data.pagination.page > 1}
        <a href={pageHref(data.pagination.page - 1)} class="btn btn-secondary btn-sm">← Sebelumnya</a>
      {/if}

      {#each pageNumbers as pageNumber (pageNumber)}
        <a
          href={pageHref(pageNumber)}
          class="btn btn-sm {pageNumber === data.pagination.page ? 'btn-primary' : 'btn-secondary'}"
          aria-current={pageNumber === data.pagination.page ? 'page' : undefined}
        >
          {pageNumber}
        </a>
      {/each}

      {#if data.pagination.page < data.pagination.totalPages}
        <a href={pageHref(data.pagination.page + 1)} class="btn btn-secondary btn-sm">Berikutnya →</a>
      {/if}
    </nav>
  {/if}
{/if}
