import { error } from '@sveltejs/kit';
import { getHomestay, getHomestayRooms, ApiError } from '#lib/api';

export async function load({ params, fetch }) {
  try {
    const [homestay, rooms] = await Promise.all([
      getHomestay(params.id, { fetch }),
      getHomestayRooms(params.id, { fetch })
    ]);
    return { homestay, rooms };
  } catch (err) {
    // 400/404 dari backend -> halaman 404; kegagalan lain (mis. backend mati) -> 503
    if (err instanceof ApiError) {
      const notFound = err.status === 400 || err.status === 404;
      error(notFound ? 404 : err.status >= 400 ? err.status : 503, err.message);
    }
    throw err;
  }
}
