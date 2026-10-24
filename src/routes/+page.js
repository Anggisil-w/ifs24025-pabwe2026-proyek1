import { listHomestays, listAllHomestays, toErrorInfo } from '#lib/api';

// Jumlah kartu per halaman (kelipatan 3 agar grid rapi)
const PAGE_SIZE = 3;

// Filter dan nomor halaman disimpan di URL (?search=&city=&page=) sehingga bisa di-bookmark/dibagikan
export async function load({ url, fetch }) {
  const search = (url.searchParams.get('search') ?? '').trim();
  const city = (url.searchParams.get('city') ?? '').trim();
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const filters = { search, city, page };

  try {
    // Backend belum punya endpoint daftar kota, jadi opsi dropdown diturunkan dari seluruh homestay
    const [result, all] = await Promise.all([
      listHomestays({ search, city, page, limit: PAGE_SIZE }, { fetch }),
      listAllHomestays({ fetch })
    ]);
    const cities = [...new Set(all.map((homestay) => homestay.city))].sort((a, b) => a.localeCompare(b, 'id'));

    return {
      filters,
      homestays: result.items,
      pagination: result.pagination,
      cities,
      loadError: null
    };
  } catch (err) {
    // Error ditampilkan di dalam halaman (bukan halaman error penuh) agar filter tetap bisa dipakai
    return {
      filters,
      homestays: [],
      pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 },
      cities: [],
      loadError: toErrorInfo(err)
    };
  }
}
