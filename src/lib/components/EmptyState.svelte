<script>
  // Kartu untuk state kosong. Tombol aksi hanya tampil jika actionHref diisi.
  let { title, description = '', actionHref = '', actionLabel = '' } = $props();
</script>

<div class="card px-6 py-12 text-center">
  <p class="text-lg font-semibold text-stone-800">{title}</p>
  {#if description}
    <p class="mt-1 text-sm text-stone-600">{description}</p>
  {/if}
  {#if actionHref}
    <a href={actionHref} class="btn btn-primary mt-5">{actionLabel}</a>
  {/if}
</div>
