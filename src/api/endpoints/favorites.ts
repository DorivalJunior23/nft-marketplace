import { http } from '../http';

interface FavoritesResponse {
  nftIds: string[];
}

export const favoritesApi = {
  list: async (): Promise<string[]> =>
    (await http.get<FavoritesResponse>('/favorites')).data.nftIds,
  add: async (nftId: string): Promise<string[]> =>
    (await http.put<FavoritesResponse>(`/favorites/${encodeURIComponent(nftId)}`)).data.nftIds,
  remove: async (nftId: string): Promise<string[]> =>
    (await http.delete<FavoritesResponse>(`/favorites/${encodeURIComponent(nftId)}`)).data.nftIds,
};
