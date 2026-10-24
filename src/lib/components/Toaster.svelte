<script>
  import Alert from './Alert.svelte';
  import { useToast } from '#lib/toast.svelte.js';

  const toast = useToast();
</script>

<!-- Wadah notifikasi global; dipasang sekali di layout utama -->
<div class="pointer-events-none fixed right-4 top-16 z-50 flex w-full max-w-sm flex-col gap-2" aria-live="polite">
  {#each toast.items as item (item.id)}
    <div class="pointer-events-auto shadow-lg">
      <Alert message={item.message} variant={item.variant} onclose={() => toast.dismiss(item.id)} />
    </div>
  {/each}
</div>
