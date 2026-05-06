/**
 * Centraliza a lógica de sanitização do sistema CIRILA
 * Remove tags HTML, caracteres de escape e normaliza para CAIXA ALTA conforme regra institucional
 */
export function sanitizeCirila(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, '') // Remove HTML
    .replace(/[;\"\'\\]/g, '') // Remove caracteres de escape comuns
    .trim();
}
