<script>
  // Tampilan form login dipakai ulang dari /login. Form tanpa atribut action
  // mengirim ke URL saat ini (/auth/login), yang punya action login yang sama.
  import LoginPage from '../../login/+page.svelte';

  let { data, form } = $props();
</script>

<svelte:head>
  <title>Masuk · Mulakjabu</title>
</svelte:head>

<LoginPage {data} {form} />
