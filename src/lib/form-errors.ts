import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { isApiClientError } from '@/api';

/**
 * Aplica erros de validação/conflito retornados pela API (`details` por campo) nos campos do
 * react-hook-form. Retorna a mensagem geral quando houver erro sem campo correspondente.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Array<Path<T>>,
): string | null {
  if (!isApiClientError(error))
    return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
  let applied = false;
  if (error.details) {
    for (const [field, messages] of Object.entries(error.details)) {
      if (fields.includes(field as Path<T>) && messages[0]) {
        setError(field as Path<T>, { type: 'server', message: messages[0] });
        applied = true;
      }
    }
  }
  // Com erro aplicado ao campo, a mensagem geral seria redundante.
  return applied ? null : error.message;
}
