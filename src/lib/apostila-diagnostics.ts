import { supabase } from '@/integrations/supabase/client';
import type { ChronologyValidationReport } from './apostila-pages';

export type ApostilaOperationStatus = 'started' | 'succeeded' | 'failed' | 'blocked';

export interface ApostilaOperationInput {
  operationId?: string;
  apostilaId?: string | null;
  pageId?: string | null;
  operationType: string;
  phase: string;
  status: ApostilaOperationStatus;
  affectedRecordIds?: string[];
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ChronologyValidationResult extends ChronologyValidationReport {
  run_id?: string;
  apostila_id?: string;
  alert_count?: number;
  issue_count?: number;
}

function newOperationId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `operation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Registra observabilidade no backend, mas degrada de forma segura quando a
 * migração ainda não chegou ao ambiente conectado.
 */
export async function recordApostilaOperation(input: ApostilaOperationInput): Promise<void> {
  const { error } = await (supabase.rpc as any)('record_apostila_operation', {
    _operation_id: input.operationId || newOperationId(),
    _apostila_id: input.apostilaId ?? null,
    _page_id: input.pageId ?? null,
    _operation_type: input.operationType,
    _phase: input.phase,
    _status: input.status,
    _affected_record_ids: input.affectedRecordIds || [],
    _error_code: input.errorCode ?? null,
    _error_message: input.errorMessage ?? null,
    _metadata: input.metadata || {},
  });

  if (error) {
    console.warn('[ApostilaDiagnostics] registro indisponível:', error.message);
  }
}

/** Executa o validador server-side. Retorna null quando a migração ainda não existe. */
export async function runApostilaChronologyValidation(
  apostilaId: string,
  triggerSource: string,
): Promise<ChronologyValidationResult | null> {
  const { data, error } = await (supabase.rpc as any)('run_apostila_chronology_validation', {
    _apostila_id: apostilaId,
    _trigger_source: triggerSource,
  });

  if (error) {
    console.warn('[ApostilaDiagnostics] validação server-side indisponível:', error.message);
    return null;
  }

  return (data || null) as ChronologyValidationResult | null;
}
