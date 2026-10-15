/**
 * Cenários determinísticos da simulação. Selecionáveis por `?mock=<id>` na URL,
 * pelo painel de mocks ou por `window.__kurio.mocks.setScenario(id)`.
 */
export interface MockScenario {
  id: string;
  label: string;
  description: string;
  /** Latência artificial em ms; null responde imediatamente. */
  latency: { min: number; max: number } | null;
  network: 'online' | 'offline';
  catalog: 'default' | 'empty' | 'server-error';
  /** Duração da sessão criada no login. */
  sessionTtlMs: number;
  favorites: 'ok' | 'fail';
  walletConnect: 'connected' | 'rejected';
  /** Disparado na primeira cotação feita a partir do checkout. */
  checkoutDisruption: null | 'price-change' | 'sold-out';
  orderCreate: 'ok' | 'timeout-once';
  orderSettlement: 'confirmed' | 'declined';
  orderSettlementMs: number;
}

const base: Omit<MockScenario, 'id' | 'label' | 'description'> = {
  latency: { min: 150, max: 450 },
  network: 'online',
  catalog: 'default',
  sessionTtlMs: 12 * 60 * 60 * 1000,
  favorites: 'ok',
  walletConnect: 'connected',
  checkoutDisruption: null,
  orderCreate: 'ok',
  orderSettlement: 'confirmed',
  orderSettlementMs: 2500,
};

export const SCENARIOS: readonly MockScenario[] = [
  {
    ...base,
    id: 'default',
    label: 'Padrão',
    description: 'Sucesso em todos os fluxos, latência curta.',
  },
  {
    ...base,
    id: 'empty',
    label: 'Catálogo vazio',
    description: 'A listagem de NFTs retorna zero resultados.',
  },
  {
    ...base,
    id: 'slow',
    label: 'Rede lenta',
    description: 'Latência de 2,5 a 4 segundos em todas as requisições.',
    latency: { min: 2500, max: 4000 },
  },
  {
    ...base,
    id: 'jitter',
    label: 'Latência variável',
    description: 'Latência de 100 ms a 2,5 s, gerando respostas fora de ordem.',
    latency: { min: 100, max: 2500 },
  },
  {
    ...base,
    id: 'offline',
    label: 'Sem conexão',
    description: 'Todas as requisições falham como erro de rede.',
    network: 'offline',
  },
  {
    ...base,
    id: 'server-error',
    label: 'Erro no servidor',
    description: 'Catálogo e detalhe respondem 503 (falha transitória).',
    catalog: 'server-error',
  },
  {
    ...base,
    id: 'session-expiring',
    label: 'Sessão expira',
    description: 'Sessões duram 20 segundos; depois disso a API responde 401.',
    sessionTtlMs: 20_000,
  },
  {
    ...base,
    id: 'favorites-fail',
    label: 'Favoritos falham',
    description: 'Mutations de favoritos respondem 503 para testar o rollback otimista.',
    favorites: 'fail',
  },
  {
    ...base,
    id: 'wallet-rejected',
    label: 'Carteira recusa',
    description: 'A conexão da carteira é recusada pelo usuário na simulação.',
    walletConnect: 'rejected',
  },
  {
    ...base,
    id: 'price-change',
    label: 'Preço muda no checkout',
    description:
      'Após a primeira cotação do checkout, o preço do primeiro item sobe via nft.updated.',
    checkoutDisruption: 'price-change',
  },
  {
    ...base,
    id: 'sold-out',
    label: 'Edição esgota no checkout',
    description:
      'Após a primeira cotação do checkout, a edição do primeiro item esgota via nft.updated.',
    checkoutDisruption: 'sold-out',
  },
  {
    ...base,
    id: 'order-timeout',
    label: 'Timeout ao criar pedido',
    description:
      'A primeira criação de pedido nunca responde e a rede demora 12 s para confirmar; "Tentar novamente" ou o próprio evento de confirmação recuperam o pedido pela mesma chave.',
    orderCreate: 'timeout-once',
    orderSettlementMs: 12_000,
  },
  {
    ...base,
    id: 'payment-declined',
    label: 'Pagamento recusado',
    description: 'O pedido é recusado pela rede após alguns segundos.',
    orderSettlement: 'declined',
  },
];

export const DEFAULT_SCENARIO_ID = 'default';

export function findScenario(id: string | null | undefined): MockScenario {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0]!;
}
