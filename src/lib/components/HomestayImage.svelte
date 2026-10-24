<script>
  // Foto homestay; jika kosong atau gagal dimuat, latar gradasi + ikon tetap terlihat.
  // Isi komponen (opsional) tampil di atas foto, mis. label kota.
  let { src = '', alt, lazy = false, large = false, class: className = '', children } = $props();
</script>

<div class="relative bg-gradient-to-br from-brand-100 to-brand-300 {className}">
  <div class="absolute inset-0 flex items-center justify-center {large ? 'text-7xl' : 'text-5xl'}" aria-hidden="true">🏡</div>
  {#if src}
    <img
      {src}
      {alt}
      loading={lazy ? 'lazy' : undefined}
      class="absolute inset-0 h-full w-full object-cover"
      onerror={(event) => (event.currentTarget.style.display = 'none')}
    />
  {/if}
  {@render children?.()}
</div>
