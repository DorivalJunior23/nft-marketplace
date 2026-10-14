/** Valor em ETH trafega sempre como string decimal (ex.: "1.19") para preservar precisão. */
export type EthAmount = string;

export type NetworkId = 'ethereum' | 'polygon' | 'solana';

export const NETWORKS: Record<NetworkId, { id: NetworkId; name: string; explorer: string }> = {
  ethereum: { id: 'ethereum', name: 'Ethereum', explorer: 'https://etherscan.io/tx/' },
  polygon: { id: 'polygon', name: 'Polygon', explorer: 'https://polygonscan.com/tx/' },
  solana: { id: 'solana', name: 'Solana', explorer: 'https://solscan.io/tx/' },
};

export type ApiErrorType =
  | 'validation_error'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'availability_conflict'
  | 'quote_outdated'
  | 'idempotency_conflict'
  | 'wallet_rejected'
  | 'transient_error'
  | 'network_error'
  | 'timeout'
  | 'unknown';

/** Corpo de erro único para toda a API: `{ type, message, details? }`. */
export interface ApiErrorBody {
  type: ApiErrorType;
  message: string;
  /** Erros por campo (validação): chave é o nome do campo. */
  details?: Record<string, string[]>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
