const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Data como no recibo do Figma: "29 Jul, 2026". */
export function formatReceiptDate(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}
