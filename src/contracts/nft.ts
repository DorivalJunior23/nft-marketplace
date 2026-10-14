import type { EthAmount, NetworkId, Paginated } from './common';

export type CollectionId =
  | 'arte-digital'
  | 'fotografia'
  | 'musica'
  | 'arte-3d'
  | 'colecionaveis'
  | 'generativa'
  | 'jogos'
  | 'assinaturas'
  | 'utilidade';

export const COLLECTIONS: ReadonlyArray<{ id: CollectionId; name: string }> = [
  { id: 'arte-digital', name: 'Arte digital' },
  { id: 'fotografia', name: 'Fotografia' },
  { id: 'musica', name: 'Música' },
  { id: 'arte-3d', name: 'Arte 3D' },
  { id: 'colecionaveis', name: 'Colecionáveis' },
  { id: 'generativa', name: 'Generativa' },
  { id: 'jogos', name: 'Jogos' },
  { id: 'assinaturas', name: 'Assinaturas' },
  { id: 'utilidade', name: 'Utilidade' },
];

export type ArtworkKey = 'ape-emerald' | 'ape-sage' | 'ape-neon' | 'ape-golden';

export type EditionId = '1-1' | '1-10' | '1-50' | 'open';

export type EditionStatus = 'available' | 'sold_out' | 'unavailable';

export interface NftEdition {
  id: EditionId;
  label: string;
  /** Unidades disponíveis para compra nesta edição. */
  available: number;
  /** Limite por pedido. */
  maxPerOrder: number;
  status: EditionStatus;
}

export interface NftSummary {
  id: string;
  name: string;
  tokenId: string;
  collection: CollectionId;
  series: string;
  network: NetworkId;
  price: EthAmount;
  compareAtPrice: EthAmount | null;
  artwork: ArtworkKey;
  rarity: 'raro' | null;
  /** Versão monotônica do recurso; eventos com versão menor ou igual são descartados. */
  version: number;
  listedAt: string;
  isNew: boolean;
  trendingScore: number;
  /** Disponibilidade total somando as edições. */
  totalAvailable: number;
}

export interface Nft extends NftSummary {
  about: string;
  description: string;
  networkNote: string;
  contractAddress: string;
  contractNote: string;
  royaltyNote: string;
  attributes: string[];
  creator: { name: string; royaltyPercent: number };
  rating: { average: number; count: number };
  editions: NftEdition[];
  gallery: ArtworkKey[];
}

export type NftSort = 'recent' | 'price-asc' | 'price-desc' | 'popular';
export type NftTab = 'all' | 'new' | 'trending';

export const NFT_SORT_OPTIONS: ReadonlyArray<{ id: NftSort; label: string }> = [
  { id: 'recent', label: 'Listados recentemente' },
  { id: 'price-asc', label: 'Menor preço' },
  { id: 'price-desc', label: 'Maior preço' },
  { id: 'popular', label: 'Mais populares' },
];

export const NFT_TABS: ReadonlyArray<{ id: NftTab; label: string }> = [
  { id: 'all', label: 'Todos os NFTs' },
  { id: 'new', label: 'Novos lançamentos' },
  { id: 'trending', label: 'Em alta' },
];

export interface NftListQuery {
  q?: string;
  collection?: CollectionId[];
  network?: NetworkId[];
  priceMin?: EthAmount;
  priceMax?: EthAmount;
  sort?: NftSort;
  tab?: NftTab;
  page?: number;
  pageSize?: number;
}

export interface NftListFacets {
  collections: Record<CollectionId, number>;
  networks: Record<NetworkId, number>;
  priceRange: { min: EthAmount; max: EthAmount };
}

export interface NftListResponse extends Paginated<NftSummary> {
  facets: NftListFacets;
}

export interface FeaturedResponse {
  hero: NftSummary;
  featured: NftSummary;
}
