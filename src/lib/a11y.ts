/** Id do elemento que descreve o campo: erro tem prioridade sobre a ajuda. */
export function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-erro`;
  if (hint) return `${id}-ajuda`;
  return undefined;
}
