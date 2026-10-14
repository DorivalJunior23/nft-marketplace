export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  ensName: string | null;
  walletAlias: string | null;
  createdAt: string;
}

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  /** Carrinho do visitante a ser mesclado ao carrinho do usuário. */
  guestCartId?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  guestCartId?: string;
}
