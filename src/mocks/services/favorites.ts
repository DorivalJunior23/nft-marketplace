import { getDb, mutateDb } from '../db/store';
import { MockApiError } from '../errors';
import { getScenario } from '../runtime';
import { getNft } from './catalog';

function assertMutationsAllowed(): void {
  if (getScenario().favorites === 'fail') {
    throw new MockApiError(
      'transient_error',
      'Não foi possível atualizar seus favoritos agora. Tente novamente.',
    );
  }
}

export function listFavorites(userId: string): string[] {
  return [...(getDb().favorites[userId] ?? [])];
}

export function addFavorite(userId: string, nftId: string): string[] {
  assertMutationsAllowed();
  getNft(nftId);
  return mutateDb((db) => {
    const current = db.favorites[userId] ?? [];
    if (!current.includes(nftId)) current.push(nftId);
    db.favorites[userId] = current;
    return [...current];
  });
}

export function removeFavorite(userId: string, nftId: string): string[] {
  assertMutationsAllowed();
  return mutateDb((db) => {
    const current = (db.favorites[userId] ?? []).filter((id) => id !== nftId);
    db.favorites[userId] = current;
    return [...current];
  });
}
