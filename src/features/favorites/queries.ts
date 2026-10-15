import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';

import { favoritesApi } from '@/api';
import { errorMessage } from '@/lib/error-message';

import { useCurrentUser } from '../auth/session-store';

/** Favoritos são privados: a chave inclui o usuário para nunca misturar caches entre contas. */
export const favoritesKeys = {
  all: ['favorites'] as const,
  list: (userId: string) => [...favoritesKeys.all, userId] as const,
};

export const favoritesOptions = (userId: string) =>
  queryOptions({
    queryKey: favoritesKeys.list(userId),
    queryFn: favoritesApi.list,
    staleTime: 60_000,
  });

export function useFavorites() {
  const user = useCurrentUser();
  return useQuery({ ...favoritesOptions(user?.id ?? 'anonymous'), enabled: Boolean(user) });
}

export function useIsFavorite(nftId: string): boolean {
  const { data } = useFavorites();
  return data?.includes(nftId) ?? false;
}

/**
 * Atualização otimista: a lista local muda na hora; se a API falhar, volta ao snapshot
 * anterior e avisa o usuário. Ao terminar, a lista é revalidada.
 */
export function useToggleFavorite() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const key = favoritesKeys.list(user?.id ?? 'anonymous');

  return useMutation({
    mutationFn: async ({ nftId, next }: { nftId: string; next: boolean }) =>
      next ? favoritesApi.add(nftId) : favoritesApi.remove(nftId),
    onMutate: async ({ nftId, next }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key) ?? [];
      queryClient.setQueryData<string[]>(
        key,
        next ? [...new Set([...previous, nftId])] : previous.filter((id) => id !== nftId),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context) queryClient.setQueryData(key, context.previous);
      toast.error(errorMessage(error, 'Não foi possível atualizar seus favoritos.'));
    },
    onSuccess: (nftIds, { next }) => {
      queryClient.setQueryData(key, nftIds);
      toast.success(
        next ? 'Adicionado à sua lista de interesse.' : 'Removido da sua lista de interesse.',
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
