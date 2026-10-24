import { listAllHomestays, listRooms, toErrorInfo } from '#lib/api';
import { requireAdmin } from '#lib/server/auth/guards';
import { apiOptions } from '#lib/server/auth/session';

// Admin memuat seluruh homestay dan seluruh kamar sekaligus (data kecil)
export async function load(event) {
  requireAdmin(event);
  const options = apiOptions(event);

  try {
    const [homestays, rooms] = await Promise.all([listAllHomestays(options), listRooms({}, options)]);
    return { homestays, rooms, loadError: null };
  } catch (err) {
    return { homestays: [], rooms: [], loadError: toErrorInfo(err) };
  }
}
