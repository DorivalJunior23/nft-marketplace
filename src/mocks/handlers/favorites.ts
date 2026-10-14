import { http } from 'msw';

import { authenticate } from '../services/auth';
import { addFavorite, listFavorites, removeFavorite } from '../services/favorites';
import { api, json, withScenario } from './shared';

export const favoritesHandlers = [
  http.get(
    api('/favorites'),
    withScenario(({ request }) => json({ nftIds: listFavorites(authenticate(request).user.id) })),
  ),
  http.put(
    api('/favorites/:nftId'),
    withScenario(({ request, params }) =>
      json({ nftIds: addFavorite(authenticate(request).user.id, String(params.nftId)) }),
    ),
  ),
  http.delete(
    api('/favorites/:nftId'),
    withScenario(({ request, params }) =>
      json({ nftIds: removeFavorite(authenticate(request).user.id, String(params.nftId)) }),
    ),
  ),
];
