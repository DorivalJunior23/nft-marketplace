import type {
  ArtworkKey,
  CollectionId,
  EditionId,
  NetworkId,
  Nft,
  NftEdition,
  Wallet,
} from '@/contracts';

import { createRandom } from './seed';

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  ensName: string | null;
  walletAlias: string | null;
  /** Hash SHA-256 (hex) de `${salt}:${senha}`; senhas nunca ficam em claro. */
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

export interface CouponRecord {
  code: string;
  description: string;
  kind: 'percent' | 'fixed';
  value: string;
  expiresAt: string | null;
}

/** Credenciais fictícias documentadas no README. */
export const FIXTURE_USERS: ReadonlyArray<{
  id: string;
  email: string;
  password: string;
  username: string;
  displayName: string;
  ensName: string;
  walletAlias: string;
}> = [
  {
    id: 'usr_nova',
    email: 'nova.sato@kurio.app',
    password: 'Kurio@2026',
    username: 'novasato',
    displayName: 'Nova Sato',
    ensName: 'nova.kurio',
    walletAlias: 'Cofre principal',
  },
  {
    id: 'usr_caio',
    email: 'caio.lima@kurio.app',
    password: 'Kurio@2026',
    username: 'caiolima',
    displayName: 'Caio Lima',
    ensName: 'caiolima',
    walletAlias: 'Carteira de coleção',
  },
];

export const COUPONS: CouponRecord[] = [
  {
    code: 'KURIO10',
    description: 'Desconto do lançamento: 10% nos NFTs',
    kind: 'percent',
    value: '10',
    expiresAt: null,
  },
  {
    code: 'GENESIS',
    description: 'Lançamento gênesis: 0.05 ETH de desconto',
    kind: 'fixed',
    value: '0.05',
    expiresAt: null,
  },
  {
    code: 'EXPIRADO',
    description: 'Cupom de teste já vencido',
    kind: 'percent',
    value: '20',
    expiresAt: '2026-01-01T00:00:00.000Z',
  },
];

export const NETWORK_FEE = '0.016';

const BASE_DATE = Date.UTC(2026, 8, 1, 12, 0, 0);

const ADJECTIVES = [
  'Amber',
  'Velvet',
  'Onyx',
  'Lunar',
  'Solar',
  'Coral',
  'Jade',
  'Crimson',
  'Azure',
  'Opal',
  'Ember',
  'Frost',
  'Indigo',
  'Sable',
  'Cobalt',
  'Ivory',
  'Golden',
  'Violet',
];
const NOUNS = [
  'Ape',
  'Nomad',
  'Vessel',
  'Bloom',
  'Baron',
  'Beat',
  'Signal',
  'Frequency',
  'Pulse',
  'Echo',
  'Drift',
  'Spark',
  'Orbit',
  'Relic',
];

const ARTWORKS: ArtworkKey[] = ['ape-emerald', 'ape-sage', 'ape-neon', 'ape-golden'];
const COLLECTION_IDS: CollectionId[] = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
];
const NETWORK_IDS: NetworkId[] = ['ethereum', 'polygon', 'solana'];

const ATTRIBUTE_POOL: Record<ArtworkKey, string[]> = {
  'ape-emerald': ['Óculos', 'Esmeralda', 'Jaqueta verde', 'Corrente dourada'],
  'ape-sage': ['Chapéu bucket', 'Moletom roxo', 'Olhar sereno'],
  'ape-neon': ['Gola alta', 'Blazer creme', 'Brinco de ouro'],
  'ape-golden': ['Fones verdes', 'Jaqueta creme', 'Aura de sálvia'],
};

/** Os nove primeiros reproduzem exatamente os NFTs desenhados no Figma. */
const FIGMA_NFTS: ReadonlyArray<{
  name: string;
  tokenId: string;
  price: string;
  compareAtPrice?: string;
  artwork: ArtworkKey;
  rarity?: 'raro';
  collection: CollectionId;
  network: NetworkId;
}> = [
  {
    name: 'Emerald Ape',
    tokenId: '0042',
    price: '1.19',
    artwork: 'ape-emerald',
    rarity: 'raro',
    collection: 'arte-digital',
    network: 'ethereum',
  },
  {
    name: 'Sage Nomad',
    tokenId: '0009',
    price: '1.69',
    artwork: 'ape-sage',
    collection: 'colecionaveis',
    network: 'polygon',
  },
  {
    name: 'Neon Vessel',
    tokenId: '0552',
    price: '1.99',
    compareAtPrice: '2.29',
    artwork: 'ape-neon',
    collection: 'arte-3d',
    network: 'ethereum',
  },
  {
    name: 'Cosmic Bloom',
    tokenId: '0118',
    price: '1.29',
    artwork: 'ape-sage',
    collection: 'generativa',
    network: 'solana',
  },
  {
    name: 'Violet Nomad',
    tokenId: '0314',
    price: '1.39',
    artwork: 'ape-sage',
    collection: 'arte-digital',
    network: 'ethereum',
  },
  {
    name: 'Ivory Baron',
    tokenId: '0088',
    price: '1.79',
    artwork: 'ape-neon',
    collection: 'fotografia',
    network: 'polygon',
  },
  {
    name: 'Golden Beat',
    tokenId: '0207',
    price: '0.99',
    artwork: 'ape-golden',
    collection: 'musica',
    network: 'ethereum',
  },
  {
    name: 'Golden Frequency',
    tokenId: '0071',
    price: '0.59',
    artwork: 'ape-golden',
    collection: 'musica',
    network: 'solana',
  },
  {
    name: 'Golden Signal',
    tokenId: '0160',
    price: '0.39',
    artwork: 'ape-golden',
    collection: 'musica',
    network: 'polygon',
  },
];

function buildEditions(
  random: ReturnType<typeof createRandom>,
  soldOutChance: number,
): NftEdition[] {
  const specs: Array<{ id: EditionId; label: string; max: number; cap: number }> = [
    { id: '1-1', label: '1/1', max: 1, cap: 1 },
    { id: '1-10', label: '1/10', max: 10, cap: 4 },
    { id: '1-50', label: '1/50', max: 50, cap: 10 },
    { id: 'open', label: 'ABERTA', max: 500, cap: 20 },
  ];
  return specs.map((spec) => {
    const soldOut = random.chance(soldOutChance);
    const available = soldOut
      ? 0
      : spec.id === '1-1'
        ? 1
        : random.int(Math.ceil(spec.max / 4), spec.max);
    return {
      id: spec.id,
      label: spec.label,
      available,
      maxPerOrder: Math.min(spec.cap, Math.max(available, 1)),
      status: soldOut ? 'sold_out' : 'available',
    };
  });
}

function slugify(name: string, tokenId: string): string {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${tokenId}`;
}

export function createNftFixtures(total = 120): Nft[] {
  const random = createRandom(20260914);
  const nfts: Nft[] = [];
  const used = new Set<string>();

  const push = (spec: (typeof FIGMA_NFTS)[number], index: number) => {
    const id = slugify(spec.name, spec.tokenId);
    if (used.has(id)) return;
    used.add(id);
    const listedAt = new Date(BASE_DATE - index * 36e5 * 7).toISOString();
    const isNew = index < 24;
    // Figma: nome com 3 dígitos ("Emerald Ape #042") e ID do token com 4 ("#0042").
    const name = `${spec.name} #${spec.tokenId.slice(1)}`;
    const attributes = [
      ...ATTRIBUTE_POOL[spec.artwork].slice(0, 2),
      spec.rarity ? 'Raro' : 'Comum',
    ];
    const editions = buildEditions(random, index === 2 ? 0.35 : 0.08);
    nfts.push({
      id,
      name,
      tokenId: `#${spec.tokenId}`,
      collection: spec.collection,
      series: 'Kurio Apes',
      network: spec.network,
      price: spec.price,
      compareAtPrice: spec.compareAtPrice ?? null,
      artwork: spec.artwork,
      rarity: spec.rarity ?? null,
      version: 1,
      listedAt,
      isNew,
      trendingScore: random.int(10, 100),
      totalAvailable: editions.reduce((sum, e) => sum + e.available, 0),
      about:
        'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.',
      description: `${name} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.\n\nA propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
      networkNote: 'Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS.',
      contractAddress: '0x7A42...19E8',
      contractNote: '0x7A42...19E8 • Contrato inteligente ERC-721 verificado.',
      royaltyNote:
        'Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
      attributes,
      creator: { name: 'Nova Sato', royaltyPercent: 5 },
      rating: { average: 4.8, count: 19 },
      editions,
      gallery: [spec.artwork, ...ARTWORKS.filter((a) => a !== spec.artwork)],
    });
  };

  FIGMA_NFTS.forEach((spec, index) => push(spec, index));

  let index = FIGMA_NFTS.length;
  while (nfts.length < total) {
    const adjective = random.pick(ADJECTIVES);
    const noun = random.pick(NOUNS);
    const tokenId = String(random.int(1, 999)).padStart(4, '0');
    const artwork = random.pick(ARTWORKS);
    const price = (random.int(2, 1230) / 100).toFixed(2);
    const hasDiscount = random.chance(0.15);
    push(
      {
        name: `${adjective} ${noun}`,
        tokenId,
        price,
        compareAtPrice: hasDiscount ? (Number(price) * 1.15).toFixed(2) : undefined,
        artwork,
        rarity: random.chance(0.2) ? 'raro' : undefined,
        collection: random.pick(COLLECTION_IDS),
        network: random.pick(NETWORK_IDS),
      },
      index,
    );
    index += 1;
  }

  return nfts;
}

export function createWalletFixtures(): Wallet[] {
  const now = '2026-09-01T12:00:00.000Z';
  return [
    {
      id: 'wal_nova_primary',
      kind: 'primary',
      displayName: 'Nova Sato',
      walletAlias: 'Principal',
      network: 'ethereum',
      profileName: 'Nova Sato',
      address: '0xA91F3c2B7e4d5F6a8B9c0D1e2F3a4B5c6D7eE82C',
      secondaryAddress: null,
      walletType: 'metamask',
      referralCode: 'KURIO-NOVA',
      email: 'nova.sato@kurio.app',
      ensName: 'nova.kurio',
      connection: 'disconnected',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'wal_nova_secondary',
      kind: 'secondary',
      displayName: 'Nova Sato',
      walletAlias: 'Reserva',
      network: 'polygon',
      profileName: 'Nova Sato',
      address: '0x5c2A9d8E7f6B5a4C3d2E1f0A9b8C7d6E5f4A3B21',
      secondaryAddress: 'nova.kurio.eth',
      walletType: 'walletconnect',
      referralCode: 'KURIO-NOVA',
      email: 'nova.sato@kurio.app',
      ensName: 'nova.kurio',
      connection: 'disconnected',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

/** Carteiras por usuário: Nova tem principal e reserva; Caio começa sem carteiras. */
export const WALLET_OWNERS: Record<string, string> = {
  wal_nova_primary: 'usr_nova',
  wal_nova_secondary: 'usr_nova',
};
