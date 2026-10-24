import { listAllHomestays, listRooms, toErrorInfo } from '#lib/api';

// Admin memuat seluruh homestay dan seluruh kamar sekaligus (data kecil)
export async function load({ fetch }) {
  try {
    const [homestays, rooms] = await Promise.all([listAllHomestays({ fetch }), listRooms({}, { fetch })]);
    return { homestays, rooms, loadError: null };
  } catch (err) {
    return { homestays: [], rooms: [], loadError: toErrorInfo(err) };
  }
}
