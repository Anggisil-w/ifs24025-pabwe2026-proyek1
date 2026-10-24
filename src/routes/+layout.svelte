<script>
  import '../app.css';
  import { navigating } from '$app/state';
  import Navbar from '#lib/components/Navbar.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import Toaster from '#lib/components/Toaster.svelte';
  import { provideSession } from '#lib/auth/session';
  import { provideToaster } from '#lib/toast.svelte.js';
  import { onDestroy } from 'svelte';

  let { children, data } = $props();

  // Sesi dan notifikasi dibagikan lewat konteks (per-render, aman untuk SSR), bukan variabel global.
  // Token login tidak ada di sini: hanya hidup di cookie httpOnly.
  provideSession(() => data.user);
  const toaster = provideToaster();
  onDestroy(() => toaster.destroy());
</script>

<!-- Indikator tipis di atas layar saat berpindah halaman / memuat data -->
{#if navigating.to}
  <div class="fixed inset-x-0 top-0 z-50 h-1 animate-pulse bg-brand-500"></div>
{/if}

<Toaster />

<div class="flex min-h-screen flex-col">
  <Navbar />
  <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
    <!-- Batas error: kesalahan saat render komponen tidak mematikan seluruh aplikasi -->
    <svelte:boundary onerror={(error) => console.error(error)}>
      {@render children()}
      {#snippet failed(error, reset)}
        <div class="mx-auto max-w-lg py-16 text-center">
          <h1 class="text-xl font-semibold text-stone-900">Terjadi kesalahan</h1>
          <p class="mt-2 text-stone-600">Bagian halaman ini gagal ditampilkan. Coba muat ulang.</p>
          <button type="button" class="btn btn-primary mt-6" onclick={reset}>Coba lagi</button>
        </div>
      {/snippet}
    </svelte:boundary>
  </main>
  <Footer />
</div>
