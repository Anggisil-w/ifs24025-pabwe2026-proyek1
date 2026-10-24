<script>
  import { invalidateAll } from '$app/navigation';
  import Alert from '#lib/components/Alert.svelte';
  import Badge from '#lib/components/Badge.svelte';
  import EmptyState from '#lib/components/EmptyState.svelte';
  import Modal from '#lib/components/Modal.svelte';
  import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
  import HomestayForm from '#lib/components/HomestayForm.svelte';
  import RoomForm from '#lib/components/RoomForm.svelte';
  import { deleteHomestay, deleteRoom, toErrorInfo } from '#lib/api';
  import { formatRupiah } from '#lib/format';
  import { useToast } from '#lib/toast.svelte.js';

  let { data } = $props();
  const toast = useToast();

  let tab = $state('homestays'); // 'homestays' | 'rooms'
  let roomFilter = $state(''); // id homestay untuk memfilter tabel kamar

  // Modal form: null = tertutup, { item: null } = tambah, { item } = ubah
  let homestayModal = $state(null);
  let roomModal = $state(null);

  // Dialog hapus: { type: 'homestay' | 'room', item }
  let deleteTarget = $state(null);
  let deleteBusy = $state(false);
  let deleteError = $state(null);

  // Jumlah kamar per homestay dihitung dari daftar kamar
  const roomCounts = $derived.by(() => {
    const counts = {};
    for (const room of data.rooms) counts[room.homestay_id] = (counts[room.homestay_id] ?? 0) + 1;
    return counts;
  });

  const homestayNames = $derived(Object.fromEntries(data.homestays.map((homestay) => [homestay.id, homestay.name])));

  const filteredRooms = $derived(
    roomFilter ? data.rooms.filter((room) => String(room.homestay_id) === roomFilter) : data.rooms
  );

  const deleteMessage = $derived(
    deleteTarget?.type === 'homestay'
      ? `Hapus homestay "${deleteTarget.item.name}"? Semua kamar milik homestay ini ikut terhapus dan tindakan ini tidak dapat dibatalkan.`
      : deleteTarget
        ? `Hapus kamar "${deleteTarget.item.name}"? Tindakan ini tidak dapat dibatalkan.`
        : ''
  );

  async function handleSaved(kind, saved, wasEdit) {
    homestayModal = null;
    roomModal = null;
    toast.success(`${kind} "${saved.name}" berhasil ${wasEdit ? 'diperbarui' : 'ditambahkan'}.`);
    await invalidateAll();
  }

  function askDelete(type, item) {
    deleteError = null;
    deleteTarget = { type, item };
  }

  async function confirmDelete() {
    deleteBusy = true;
    deleteError = null;
    try {
      if (deleteTarget.type === 'homestay') {
        await deleteHomestay(deleteTarget.item.id);
      } else {
        await deleteRoom(deleteTarget.item.id);
      }
      toast.success(`${deleteTarget.type === 'homestay' ? 'Homestay' : 'Kamar'} "${deleteTarget.item.name}" berhasil dihapus.`);
      deleteTarget = null;
      await invalidateAll();
    } catch (err) {
      // 409 (masih punya pesanan) ditampilkan di dalam dialog agar admin tahu alasannya
      deleteError = toErrorInfo(err);
    } finally {
      deleteBusy = false;
    }
  }
</script>

<svelte:head>
  <title>Admin · Mulakjabu</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-2xl font-bold text-stone-900">Panel Admin</h1>
    <p class="text-sm text-stone-500">Kelola data homestay dan kamar.</p>
  </div>
  {#if !data.loadError}
    {#if tab === 'homestays'}
      <button type="button" class="btn btn-primary" onclick={() => (homestayModal = { item: null })}>+ Tambah homestay</button>
    {:else}
      <button
        type="button"
        class="btn btn-primary"
        disabled={data.homestays.length === 0}
        onclick={() => (roomModal = { item: null })}
      >
        + Tambah kamar
      </button>
    {/if}
  {/if}
</div>

<div class="mb-6 flex gap-2 border-b border-stone-200" role="tablist">
  <button
    type="button"
    role="tab"
    aria-selected={tab === 'homestays'}
    class="-mb-px border-b-2 px-4 py-2 text-sm font-semibold {tab === 'homestays'
      ? 'border-brand-600 text-brand-700'
      : 'border-transparent text-stone-500 hover:text-stone-800'}"
    onclick={() => (tab = 'homestays')}
  >
    Kelola Homestay ({data.homestays.length})
  </button>
  <button
    type="button"
    role="tab"
    aria-selected={tab === 'rooms'}
    class="-mb-px border-b-2 px-4 py-2 text-sm font-semibold {tab === 'rooms'
      ? 'border-brand-600 text-brand-700'
      : 'border-transparent text-stone-500 hover:text-stone-800'}"
    onclick={() => (tab = 'rooms')}
  >
    Kelola Kamar ({data.rooms.length})
  </button>
</div>

{#if data.loadError}
  <div class="mb-4"><Alert error={data.loadError} /></div>
{/if}

{#if !data.loadError}
  {#if tab === 'homestays'}
    {#if data.homestays.length === 0}
      <EmptyState title="Belum ada homestay." description={'Klik "Tambah homestay" untuk memulai.'} />
    {:else}
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th class="px-4 py-3">Homestay</th>
              <th class="px-4 py-3">Kota</th>
              <th class="px-4 py-3">Alamat</th>
              <th class="px-4 py-3">Telepon</th>
              <th class="px-4 py-3 text-center">Kamar</th>
              <th class="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            {#each data.homestays as homestay (homestay.id)}
              <tr class="align-top">
                <td class="px-4 py-3 font-medium text-stone-900">{homestay.name}</td>
                <td class="px-4 py-3">{homestay.city}</td>
                <td class="px-4 py-3 text-stone-600">{homestay.address}</td>
                <td class="px-4 py-3 text-stone-600">{homestay.phone ?? '-'}</td>
                <td class="px-4 py-3 text-center">{roomCounts[homestay.id] ?? 0}</td>
                <td class="whitespace-nowrap px-4 py-3 text-right">
                  <button type="button" class="btn btn-secondary btn-sm" onclick={() => (homestayModal = { item: homestay })}>Edit</button>
                  <button type="button" class="btn btn-danger btn-sm" onclick={() => askDelete('homestay', homestay)}>Hapus</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {:else}
    <div class="mb-4 flex items-center gap-3">
      <label class="text-sm text-stone-600" for="room-filter">Tampilkan kamar milik</label>
      <select id="room-filter" class="input max-w-xs" bind:value={roomFilter}>
        <option value="">Semua homestay</option>
        {#each data.homestays as homestay (homestay.id)}
          <option value={String(homestay.id)}>{homestay.name}</option>
        {/each}
      </select>
    </div>

    {#if filteredRooms.length === 0}
      <EmptyState title="Tidak ada kamar untuk ditampilkan." />
    {:else}
      <div class="card overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-200 text-sm">
          <thead class="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th class="px-4 py-3">Kamar</th>
              <th class="px-4 py-3">Homestay</th>
              <th class="px-4 py-3">Jenis</th>
              <th class="px-4 py-3 text-center">Kapasitas</th>
              <th class="px-4 py-3 text-right">Harga / malam</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            {#each filteredRooms as room (room.id)}
              <tr class="align-top">
                <td class="px-4 py-3 font-medium text-stone-900">{room.name}</td>
                <td class="px-4 py-3 text-stone-600">{homestayNames[room.homestay_id] ?? `#${room.homestay_id}`}</td>
                <td class="px-4 py-3 capitalize">{room.type}</td>
                <td class="px-4 py-3 text-center">{room.capacity}</td>
                <td class="px-4 py-3 text-right">{formatRupiah(room.price_per_night)}</td>
                <td class="px-4 py-3"><Badge status={room.is_active ? 'active' : 'inactive'} /></td>
                <td class="whitespace-nowrap px-4 py-3 text-right">
                  <button type="button" class="btn btn-secondary btn-sm" onclick={() => (roomModal = { item: room })}>Edit</button>
                  <button type="button" class="btn btn-danger btn-sm" onclick={() => askDelete('room', room)}>Hapus</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {/if}
{/if}

{#if homestayModal}
  <Modal title={homestayModal.item ? 'Ubah homestay' : 'Tambah homestay'} onclose={() => (homestayModal = null)}>
    <HomestayForm
      homestay={homestayModal.item}
      onsaved={(saved) => handleSaved('Homestay', saved, homestayModal?.item !== null)}
      oncancel={() => (homestayModal = null)}
    />
  </Modal>
{/if}

{#if roomModal}
  <Modal title={roomModal.item ? 'Ubah kamar' : 'Tambah kamar'} wide onclose={() => (roomModal = null)}>
    <RoomForm
      room={roomModal.item}
      homestays={data.homestays}
      defaultHomestayId={roomFilter}
      onsaved={(saved) => handleSaved('Kamar', saved, roomModal?.item !== null)}
      oncancel={() => (roomModal = null)}
    />
  </Modal>
{/if}

{#if deleteTarget}
  <ConfirmDialog
    title={deleteTarget.type === 'homestay' ? 'Hapus homestay?' : 'Hapus kamar?'}
    message={deleteMessage}
    busy={deleteBusy}
    error={deleteError}
    onconfirm={confirmDelete}
    oncancel={() => (deleteTarget = null)}
  />
{/if}
