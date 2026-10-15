import type {
  CollectionId,
  EditionId,
  FeaturedResponse,
  NetworkId,
  Nft,
  NftEdition,
  NftListFacets,
  NftListQuery,
  NftListResponse,
  NftSummary,
  NftUpdatedEvent,
} from '@/contracts';
import { compareEth, mulEth, roundEth } from '@/lib/money';

import { getDb, mutateDb } from '../db/store';
import { notFound } from '../errors';
import { realtimeBus } from '../realtime-bus';
import { getScenario } from '../runtime';

export const PAGE_SIZE = 9;

const SUMMARY_KEYS: Array<keyof NftSummary> = [
  'id',
  'name',
  'tokenId',
  'collection',
  'series',
  'network',
  'price',
  'compareAtPrice',
  'artwork',
  'rarity',
  'version',
  'listedAt',
  'isNew',
  'trendingScore',
  'totalAvailable',
];

export function toSummary(nft: Nft): NftSummary {
  const summary = {} as Record<keyof NftSummary, unknown>;
  for (const key of SUMMARY_KEYS) summary[key] = nft[key];
  return summary as NftSummary;
}

function matchesQuery(nft: Nft, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    nft.name.toLowerCase().includes(needle) ||
    nft.tokenId.toLowerCase().includes(needle) ||
    nft.series.toLowerCase().includes(needle)
  );
}

function applyFilters(nfts: Nft[], query: NftListQuery, skip?: 'collection' | 'network'): Nft[] {
  return nfts.filter((nft) => {
    if (query.q && !matchesQuery(nft, query.q)) return false;
    if (
      skip !== 'collection' &&
      query.collection?.length &&
      !query.collection.includes(nft.collection)
    )
      return false;
    if (skip !== 'network' && query.network?.length && !query.network.includes(nft.network))
      return false;
    if (query.priceMin && compareEth(nft.price, query.priceMin) < 0) return false;
    if (query.priceMax && compareEth(nft.price, query.priceMax) > 0) return false;
    if (query.tab === 'new' && !nft.isNew) return false;
    if (query.tab === 'trending' && nft.trendingScore < 60) return false;
    return true;
  });
}

function sortNfts(nfts: Nft[], sort: NftListQuery['sort']): Nft[] {
  const sorted = [...nfts];
  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => compareEth(a.price, b.price) || a.name.localeCompare(b.name));
    case 'price-desc':
      return sorted.sort((a, b) => compareEth(b.price, a.price) || a.name.localeCompare(b.name));
    case 'popular':
      return sorted.sort(
        (a, b) => b.trendingScore - a.trendingScore || a.name.localeCompare(b.name),
      );
    case 'recent':
    default:
      return sorted.sort(
        (a, b) => b.listedAt.localeCompare(a.listedAt) || a.name.localeCompare(b.name),
      );
  }
}

function buildFacets(nfts: Nft[], query: NftListQuery): NftListFacets {
  const collections = {} as Record<CollectionId, number>;
  const networks = {} as Record<NetworkId, number>;
  for (const nft of applyFilters(nfts, query, 'collection')) {
    collections[nft.collection] = (collections[nft.collection] ?? 0) + 1;
  }
  for (const nft of applyFilters(nfts, query, 'network')) {
    networks[nft.network] = (networks[nft.network] ?? 0) + 1;
  }
  const prices = nfts.map((nft) => nft.price).sort(compareEth);
  return {
    collections,
    networks,
    priceRange: { min: prices[0] ?? '0', max: prices[prices.length - 1] ?? '0' },
  };
}

export function listNfts(query: NftListQuery): NftListResponse {
  const scenario = getScenario();
  const all = scenario.catalog === 'empty' ? [] : getDb().nfts;
  const filtered = sortNfts(applyFilters(all, query), query.sort);
  const pageSize = query.pageSize ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(query.page ?? 1, 1), totalPages);
  const start = (page - 1) * pageSize;
  return {
    items: filtered.slice(start, start + pageSize).map(toSummary),
    page,
    pageSize,
    total: filtered.length,
    totalPages,
    facets: buildFacets(all, query),
  };
}

export function getNft(id: string): Nft {
  const nft = getDb().nfts.find((item) => item.id === id);
  if (!nft) throw notFound('Este NFT não existe ou foi removido do catálogo.');
  return nft;
}

export function findNft(id: string): Nft | undefined {
  return getDb().nfts.find((item) => item.id === id);
}

export function getEdition(nft: Nft, editionId: EditionId): NftEdition {
  const edition = nft.editions.find((item) => item.id === editionId);
  if (!edition) throw notFound('Edição não encontrada para este NFT.');
  return edition;
}

export function getFeatured(): FeaturedResponse {
  const nfts = getDb().nfts;
  const hero = nfts.find((nft) => nft.id === 'emerald-ape-0042') ?? nfts[0];
  const featured = nfts.find((nft) => nft.id === 'sage-nomad-0009') ?? nfts[1] ?? nfts[0];
  if (!hero || !featured) throw notFound('Catálogo vazio.');
  const slideIds = ['emerald-ape-0042', 'neon-vessel-0552', 'golden-beat-0207'];
  const slides = slideIds
    .map((id) => nfts.find((nft) => nft.id === id))
    .filter((nft): nft is Nft => Boolean(nft));
  return {
    hero: toSummary(hero),
    featured: toSummary(featured),
    slides: slides.length ? slides.map(toSummary) : [toSummary(hero)],
  };
}

export function relatedNfts(nft: Nft, limit = 5): NftSummary[] {
  return getDb()
    .nfts.filter((item) => item.id !== nft.id && item.series === nft.series)
    .slice(0, limit)
    .map(toSummary);
}

function recalcAvailability(nft: Nft): void {
  nft.editions.forEach((edition) => {
    if (edition.status !== 'unavailable')
      edition.status = edition.available > 0 ? 'available' : 'sold_out';
    edition.maxPerOrder = Math.min(edition.maxPerOrder || 1, Math.max(edition.available, 1));
  });
  nft.totalAvailable = nft.editions.reduce((sum, edition) => sum + edition.available, 0);
}

function publishNftUpdate(nft: Nft): NftUpdatedEvent {
  const event: NftUpdatedEvent = {
    eventId: realtimeBus.nextEventId('evt_nft'),
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: new Date().toISOString(),
    data: {
      price: nft.price,
      compareAtPrice: nft.compareAtPrice,
      editions: nft.editions.map((edition) => ({ ...edition })),
      totalAvailable: nft.totalAvailable,
    },
  };
  realtimeBus.publish({ event, targetUserId: null });
  return event;
}

/** Altera o preço de um NFT, incrementa a versão e emite nft.updated. */
export function updateNftPrice(id: string, price: string): NftUpdatedEvent {
  return mutateDb(() => {
    const nft = getNft(id);
    nft.compareAtPrice = compareEth(price, nft.price) > 0 ? nft.price : nft.compareAtPrice;
    nft.price = roundEth(price, 4);
    nft.version += 1;
    return publishNftUpdate(nft);
  });
}

export function increaseNftPrice(id: string, factor = 1.1): NftUpdatedEvent {
  const nft = getNft(id);
  return updateNftPrice(id, roundEth(mulEth(nft.price, factor), 2));
}

/** Define a disponibilidade de uma edição (0 = esgotada) e emite nft.updated. */
export function setEditionAvailability(
  id: string,
  editionId: EditionId,
  available: number,
): NftUpdatedEvent {
  return mutateDb(() => {
    const nft = getNft(id);
    const edition = getEdition(nft, editionId);
    edition.available = Math.max(0, available);
    recalcAvailability(nft);
    nft.version += 1;
    return publishNftUpdate(nft);
  });
}

/** Reserva unidades (pedido criado). Lança conflito se não houver disponibilidade. */
export function adjustAvailability(
  lines: Array<{ nftId: string; editionId: EditionId; quantity: number }>,
  direction: -1 | 1,
): void {
  mutateDb(() => {
    for (const line of lines) {
      const nft = getNft(line.nftId);
      const edition = getEdition(nft, line.editionId);
      edition.available = Math.max(0, edition.available + direction * line.quantity);
      recalcAvailability(nft);
      nft.version += 1;
      publishNftUpdate(nft);
    }
  });
}

/** Reemite o estado atual de um NFT (duplicata proposital, mesma versão) para testes. */
export function republishNft(id: string): NftUpdatedEvent {
  return publishNftUpdate(getNft(id));
}
