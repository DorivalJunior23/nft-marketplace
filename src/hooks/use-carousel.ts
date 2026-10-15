import { useCallback, useEffect, useState } from 'react';

import { usePrefersReducedMotion } from './use-reduced-motion';

/**
 * Carrossel com avanço automático. Pausa em hover/foco e não avança sozinho quando o
 * usuário prefere movimento reduzido (a navegação manual continua disponível).
 */
export function useCarousel(length: number, intervalMs = 5000) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (length <= 1 || paused || reducedMotion) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % length),
      intervalMs,
    );
    return () => window.clearInterval(timer);
  }, [length, paused, reducedMotion, intervalMs]);

  const goTo = useCallback(
    (next: number) => setIndex(((next % length) + length) % length),
    [length],
  );

  return {
    index: length ? index % length : 0,
    goTo,
    next: () => goTo(index + 1),
    previous: () => goTo(index - 1),
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    reducedMotion,
  };
}
