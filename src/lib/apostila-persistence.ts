import { supabase } from '@/integrations/supabase/client';

export interface ApostilaPersistenceDraft {
  apostilaId: string;
  expectedRevision: number;
  title: string;
  category: string;
  content: string;
  published: boolean;
  semester: number | null;
  course: string[] | null;
  savedDate: string | null;
}

export interface ApostilaPagePersistenceDraft {
  pageId: string;
  apostilaId: string;
  expectedRevision: number;
  title: string;
  content: string;
  savedDate: string | null;
}

export async function saveApostilaWithRevision(draft: ApostilaPersistenceDraft) {
  const params = {
    _apostila_id: draft.apostilaId,
    _expected_revision: draft.expectedRevision,
    _title: draft.title,
    _category: draft.category,
    _content: draft.content,
    _published: draft.published,
    _semester: draft.semester,
    _course: draft.course,
    _saved_date: draft.savedDate,
  } as any;
  let result = await supabase.rpc('save_apostila' as any, params);
  if (isTransientSaveError(result.error)) {
    // Um timeout do gateway não informa se a transação foi cancelada ou apenas
    // se a resposta chegou tarde. Antes de repetir uma gravação com revisão,
    // esperamos a confirmação de leitura: assim uma gravação que já ocorreu
    // não vira um falso erro de "não salvo" no editor.
    const confirmed = await waitForSavedApostila(draft);
    if (confirmed) return confirmed;
    // Uma única repetição com a mesma revisão é segura: se a primeira chamada
    // tiver concluído após o timeout, o banco responderá conflito e faremos a
    // leitura de confirmação; se não concluiu, esta chamada salva o rascunho.
    result = await supabase.rpc('save_apostila' as any, params);
    if (isRevisionConflict(result.error)) {
      const savedAfterRetry = await waitForSavedApostila(draft);
      if (savedAfterRetry) return savedAfterRetry;
    }
  }
  return confirmSavedDraft(result, draft.apostilaId, draft);
}

/**
 * A criação não é considerada concluída apenas porque a resposta do INSERT
 * chegou. A leitura pelo mesmo cliente confirma que o registro e o conteúdo
 * realmente ficaram visíveis antes de a interface anunciar sucesso.
 */
export async function confirmCreatedApostila(input: { id: string; title: string; content: string }) {
  const { data, error } = await supabase
    .from('apostilas')
    .select('id, title, content')
    .eq('id', input.id)
    .maybeSingle();
  if (error) return { data: null, error };
  if (!data || data.title !== input.title || data.content !== input.content) {
    return {
      data: null,
      error: {
        code: 'CREATE_NOT_CONFIRMED',
        message: 'O banco não confirmou a nova apostila. Ela não será exibida como salva.',
        details: '',
        hint: '',
      },
    };
  }
  return { data, error: null };
}

export async function saveApostilaPageWithRevision(draft: ApostilaPagePersistenceDraft) {
  const params = {
    _page_id: draft.pageId,
    _apostila_id: draft.apostilaId,
    _expected_revision: draft.expectedRevision,
    _title: draft.title,
    _content: draft.content,
    _saved_date: draft.savedDate,
  } as any;
  let result = await supabase.rpc('save_apostila_page' as any, params);
  if (isTransientSaveError(result.error)) {
    const confirmed = await waitForSavedPage(draft);
    if (confirmed) return confirmed;
    result = await supabase.rpc('save_apostila_page' as any, params);
    if (isRevisionConflict(result.error)) {
      const savedAfterRetry = await waitForSavedPage(draft);
      if (savedAfterRetry) return savedAfterRetry;
    }
  }
  return confirmSavedDraft(result, draft.pageId, draft, draft.apostilaId);
}

function isTransientSaveError(error: any) {
  const text = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
  return /timeout|timed out|network|fetch failed|gateway/.test(text) || [502, 503, 504].includes(Number(error?.status));
}

function isRevisionConflict(error: any) {
  return error?.code === '40001';
}

const SAVE_CONFIRMATION_DELAYS_MS = [0, 250, 750] as const;

function wait(ms: number) {
  return new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms));
}

async function waitForSavedApostila(draft: ApostilaPersistenceDraft) {
  for (const delay of SAVE_CONFIRMATION_DELAYS_MS) {
    if (delay) await wait(delay);
    const confirmed = await findSavedApostila(draft);
    if (confirmed) return confirmed;
  }
  return null;
}

async function waitForSavedPage(draft: ApostilaPagePersistenceDraft) {
  for (const delay of SAVE_CONFIRMATION_DELAYS_MS) {
    if (delay) await wait(delay);
    const confirmed = await findSavedPage(draft);
    if (confirmed) return confirmed;
  }
  return null;
}

async function findSavedApostila(draft: ApostilaPersistenceDraft) {
  const { data, error } = await supabase
    .from('apostilas')
    .select('id, title, content')
    .eq('id', draft.apostilaId)
    .maybeSingle();
  if (error || !data || data.title !== draft.title || data.content !== draft.content) return null;
  return { data: [data], error: null };
}

async function findSavedPage(draft: ApostilaPagePersistenceDraft) {
  const { data, error } = await supabase
    .from('apostila_pages')
    .select('id, apostila_id, title, content')
    .eq('id', draft.pageId)
    .eq('apostila_id', draft.apostilaId)
    .maybeSingle();
  if (error || !data || data.title !== draft.title || data.content !== draft.content) return null;
  return { data: [data], error: null };
}

function confirmSavedDraft<T extends { data: unknown; error: unknown }>(
  result: T,
  id: string,
  draft: { title: string; content: string },
  apostilaId?: string,
) {
  if (result.error) return result;
  const rows = Array.isArray(result.data) ? result.data : [result.data];
  const row = rows[0] as { id?: string; title?: string; content?: string; apostila_id?: string } | null;
  if (rows.length === 1 && row?.id === id && row.title === draft.title
    && row.content === draft.content && (!apostilaId || row.apostila_id === apostilaId)) return result;
  return {
    ...result,
    data: null,
    error: {
      code: 'SAVE_NOT_CONFIRMED',
      message: 'O banco não confirmou o conteúdo enviado. Sua edição deve permanecer aberta.',
      details: '',
      hint: '',
    },
  };
}
