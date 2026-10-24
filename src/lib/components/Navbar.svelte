<script>
  import { page } from '$app/state';
  import { useSession } from '#lib/auth/session';

  const session = useSession();

  // Status menu mobile (buka/tutup)
  let open = $state(false);

  const user = $derived(session.user);

  // Menu mengikuti peran: Pesanan untuk yang sudah login, Admin hanya untuk admin
  const links = $derived([
    { href: '/', label: 'Katalog' },
    ...(user ? [{ href: '/bookings', label: session.isAdmin ? 'Pesanan' : 'Pesanan saya' }] : []),
    ...(session.isAdmin ? [{ href: '/admin', label: 'Admin' }] : [])
  ]);

  // Halaman detail homestay dianggap bagian dari "Katalog"
  function isActive(href) {
    const path = page.url.pathname;
    if (href === '/') return path === '/' || path.startsWith('/homestays');
    return path.startsWith(href);
  }
</script>

<header class="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
  <nav class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="Navigasi utama">
    <a href="/" class="flex items-center gap-2 text-lg font-bold text-brand-700">
      <span aria-hidden="true">🏡</span>
      Mulakjabu
    </a>

    <ul class="hidden items-center gap-1 sm:flex">
      {#each links as link (link.href)}
        <li>
          <a
            href={link.href}
            class="rounded-lg px-3 py-2 text-sm font-medium transition {isActive(link.href)
              ? 'bg-brand-50 text-brand-700'
              : 'text-stone-600 hover:bg-stone-100'}"
            aria-current={isActive(link.href) ? 'page' : undefined}
          >
            {link.label}
          </a>
        </li>
      {/each}
    </ul>

    <div class="hidden items-center gap-2 sm:flex">
      {#if user}
        <span class="text-sm text-stone-600" title={user.email}>
          {user.name}
          {#if session.isAdmin}
            <span class="ml-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">Admin</span>
          {/if}
        </span>
        <form method="POST" action="/logout">
          <button type="submit" class="btn btn-secondary btn-sm">Keluar</button>
        </form>
      {:else}
        <a href="/login" class="btn btn-secondary btn-sm">Masuk</a>
        <a href="/register" class="btn btn-primary btn-sm">Daftar</a>
      {/if}
    </div>

    <button
      type="button"
      class="rounded-lg p-2 text-stone-600 hover:bg-stone-100 sm:hidden"
      aria-label="Buka menu"
      aria-expanded={open}
      onclick={() => (open = !open)}
    >
      ☰
    </button>
  </nav>

  {#if open}
    <ul class="space-y-1 border-t border-stone-200 px-4 py-2 sm:hidden">
      {#each links as link (link.href)}
        <li>
          <a
            href={link.href}
            class="block rounded-lg px-3 py-2 text-sm font-medium {isActive(link.href)
              ? 'bg-brand-50 text-brand-700'
              : 'text-stone-600 hover:bg-stone-100'}"
            onclick={() => (open = false)}
          >
            {link.label}
          </a>
        </li>
      {/each}
      <li class="border-t border-stone-100 pt-2">
        {#if user}
          <p class="px-3 pb-2 text-sm text-stone-600">{user.name} · {session.isAdmin ? 'Admin' : 'Tamu'}</p>
          <form method="POST" action="/logout">
            <button type="submit" class="btn btn-secondary btn-sm w-full">Keluar</button>
          </form>
        {:else}
          <div class="flex gap-2">
            <a href="/login" class="btn btn-secondary btn-sm flex-1" onclick={() => (open = false)}>Masuk</a>
            <a href="/register" class="btn btn-primary btn-sm flex-1" onclick={() => (open = false)}>Daftar</a>
          </div>
        {/if}
      </li>
    </ul>
  {/if}
</header>
