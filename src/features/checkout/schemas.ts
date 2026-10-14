import { z } from 'zod';

const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

/** Campos do "Perfil do colecionador" no pagamento (Figma), todos obrigatórios exceto os marcados. */
export const collectorSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe o nome de exibição.'),
  network: z.enum(['ethereum', 'polygon', 'solana'], { message: 'Selecione uma rede.' }),
  walletAddress: z
    .string()
    .trim()
    .regex(ADDRESS, 'Informe um endereço 0x com 40 caracteres hexadecimais.'),
  walletType: z.enum(['metamask', 'walletconnect', 'coinbase'], {
    message: 'Selecione uma carteira.',
  }),
  email: z.string().trim().email('Informe um e-mail válido.'),
  username: z.string().trim().min(3, 'Informe o nome de usuário.'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.'),
  secondaryAddress: z
    .string()
    .trim()
    .refine(
      (value) => !value || ADDRESS.test(value) || /^[a-z0-9-]{3,40}(\.eth)?$/i.test(value),
      'Informe um endereço 0x ou um nome ENS.',
    ),
  referralCode: z.string().trim().min(1, 'Informe o código de indicação.'),
  ensName: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?=.{3,40}$)[a-z0-9-]+(\.[a-z0-9-]+)*$/,
      'Use de 3 a 40 caracteres: letras minúsculas, números, hífen ou ponto.',
    ),
  note: z.string().trim().max(500, 'Use no máximo 500 caracteres.'),
});

export type CollectorFormValues = z.infer<typeof collectorSchema>;
