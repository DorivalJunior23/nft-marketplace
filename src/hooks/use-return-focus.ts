import { useCallback, type RefObject } from 'react';

/**
 * Diálogos e drawers abertos por botões comuns (fora do Radix Trigger) precisam devolver
 * o foco ao gatilho ao fechar. Use o retorno em `onCloseAutoFocus` do conteúdo Radix.
 */
export function useReturnFocus(triggerRef: RefObject<HTMLElement | null>) {
  return useCallback(
    (event: Event) => {
      if (!triggerRef.current) return;
      event.preventDefault();
      triggerRef.current.focus();
    },
    [triggerRef],
  );
}
