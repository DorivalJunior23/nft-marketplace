import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { isApiClientError } from '@/api';
import { Container } from '@/components/common/container';
import { ErrorState } from '@/components/common/query-state';
import { NotFoundPage } from '@/components/layout/not-found-page';
import { nftDetailOptions } from '@/features/catalog/queries';
import {
  MobileNftDetailPage,
  MobileNftDetailSkeleton,
} from '@/features/nft-detail/mobile-nft-detail-page';
import { NftDetailPage, NftDetailSkeleton } from '@/features/nft-detail/nft-detail-page';
import { useIsDesktop } from '@/hooks/use-media-query';

export const Route = createFileRoute('/nft/$nftId')({
  component: NftDetailRoute,
});

/** Acesso direto suportado: a consulta roda no cliente e trata inexistente, erro e carregamento. */
function NftDetailRoute() {
  const { nftId } = Route.useParams();
  const isDesktop = useIsDesktop();
  const detail = useQuery(nftDetailOptions(nftId));

  if (detail.isPending) return isDesktop ? <NftDetailSkeleton /> : <MobileNftDetailSkeleton />;

  if (detail.isError) {
    if (isApiClientError(detail.error) && detail.error.status === 404) {
      return (
        <NotFoundPage
          title="NFT não encontrado"
          description="Este NFT não existe ou foi removido do catálogo."
        />
      );
    }
    return (
      <Container className="pt-10">
        <ErrorState
          error={detail.error}
          onRetry={() => void detail.refetch()}
          title="Não foi possível carregar o NFT"
        />
      </Container>
    );
  }

  return isDesktop ? (
    <NftDetailPage nft={detail.data} />
  ) : (
    <MobileNftDetailPage nft={detail.data} />
  );
}
