<script>
  import { page } from '$app/state';
</script>

<svelte:head>
  <title>{page.status} · Mulakjabu</title>
</svelte:head>

<div class="mx-auto max-w-lg py-16 text-center">
  <p class="text-6xl font-bold text-brand-600">{page.status}</p>
  <h1 class="mt-4 text-xl font-semibold text-stone-900">
    {page.status === 404 ? 'Halaman tidak ditemukan' : page.status === 403 ? 'Akses ditolak' : 'Terjadi kesalahan'}
  </h1>
  <p class="mt-2 text-stone-600">{page.error?.message}</p>
  <a href="/" class="btn btn-primary mt-6">Kembali ke katalog</a>
</div>
