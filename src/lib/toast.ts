import { toast as sonner, type ExternalToast } from 'sonner';

type Message = Parameters<typeof sonner.success>[0];

/** Por padrão a própria mensagem é o id: repetir a ação substitui o toast em vez de empilhar. */
function withId(message: Message, options?: ExternalToast): ExternalToast {
  return { id: typeof message === 'string' ? message : undefined, ...options };
}

export const toast = {
  success: (message: Message, options?: ExternalToast) =>
    sonner.success(message, withId(message, options)),
  error: (message: Message, options?: ExternalToast) =>
    sonner.error(message, withId(message, options)),
  info: (message: Message, options?: ExternalToast) =>
    sonner.info(message, withId(message, options)),
  warning: (message: Message, options?: ExternalToast) =>
    sonner.warning(message, withId(message, options)),
  dismiss: sonner.dismiss,
};
