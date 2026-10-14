import { useSyncExternalStore } from 'react';

/** Breakpoint único entre a composição mobile (< 768px) e a desktop (>= 768px), como no Figma. */
export const DESKTOP_QUERY = '(min-width: 768px)';

function subscribe(query: string, callback: () => void): () => void {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
