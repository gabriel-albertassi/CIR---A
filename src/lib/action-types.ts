/**
 * Padrão de resposta para Server Actions (Discriminated Union)
 * Este padrão garante que o 'error' esteja presente apenas quando 'success' for false.
 */
export type ActionResult<T = void> = 
  | (T extends void ? { success: true; data?: never } : { success: true; data: T })
  | { success: false; error: string };
