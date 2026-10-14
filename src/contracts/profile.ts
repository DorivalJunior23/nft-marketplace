export interface Profile {
  displayName: string;
  username: string;
  email: string;
  ensName: string | null;
  walletAlias: string | null;
  avatarUrl: string | null;
}

export type UpdateProfileRequest = Partial<Omit<Profile, 'avatarUrl'>>;

export interface UpdateAvatarRequest {
  /** Data URL (base64) da imagem; a simulação não possui storage de arquivos. */
  dataUrl: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}
