/**
 * Serialização dos parâmetros de busca em formato legível (`?q=ape&collection=musica,jogos&page=2`),
 * em vez do JSON padrão do TanStack Router. Arrays viram listas separadas por vírgula; cada rota
 * valida e converte os valores com zod em `validateSearch`.
 */
export function parseSearch(searchStr: string): Record<string, string> {
  const params = new URLSearchParams(searchStr.startsWith('?') ? searchStr.slice(1) : searchStr);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.map(String).join(','));
      continue;
    }
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}
