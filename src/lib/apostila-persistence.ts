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

const TRANSIENT_ERROR_CODES = new Set(['FETCH_ERROR', 'PGRST301', '57014', '08000', '08003', '08006', '57P01']);

function isTransientError(error: any) {
  const code = String(error?.code ?? '').toUpperCase();
  const message = String(error?.message ?? '').toLowerCase();
  return TRANSIENT_ERROR_CODES.has(code)
    || code.startsWith('08')
    || message.includes('network')
    || message.includes('fetch')
    || message.includes('timeout')
    || message.includes('temporarily unavailable')
    || message.includes('connection reset');
}

async function confirmPersistedContent(
  id: string,
  draft: { title: string; content: string },
  apostilaId?: string,
) {
  const table = apostilaId ? 'apostila_pages' : 'apostilas';
  let query = supabase.from(table).select('id, title, content' + (apostilaId ? ', apostila_id' : '')).eq('id', id).maybeSingle();
  if (apostilaId) query = query.eq('apostila_id', apostilaId) as any;
  const { data, error } = await query;
  if (error || !data) return false;
  return data.id === id
    && data.title === draft.title
    && data.content === draft.content
    && (!apostilaId || data.apostila_id === apostilaId);
}

async function runSaveWithRecovery<T extends { data: unknown; error: any }>(
  saveOnce: () => Promise<T>,
  id: string,
  draft: { title: string; content: string },
  apostilaId?: string,
) {
  let result = await saveOnce();
  if (!result.error) return confirmSavedDraft(result, id, draft, apostilaId);

  // An ambiguous network failure can mean that Postgres committed but the
  // response never reached the browser. Verify before attempting another write.
  if (await confirmPersistedContent(id, draft, apostilaId)) {
    const { data } = await (apostilaId
      ? supabase.from('apostila_pages').select('*').eq('id', id).eq('apostila_id', apostilaId).maybeSingle()
      : supabase.from('apostilas').select('*').eq('id', id).maybeSingle());
    return { ...result, data, error: null } as T;
  }

  if (String(result.error?.code ?? '') === '40001') return result;
  if (!isTransientError(result.error)) return result;

  for (const delayMs of [350, 900]) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    result = await saveOnce();
    if (!result.error) return confirmSavedDraft(result, id, draft, apostilaId);
    if (await confirmPersistedContent(id, draft, apostilaId)) {
      const { data } = await (apostilaId
        ? supabase.from('apostila_pages').select('*').eq('id', id).eq('apostila_id', apostilaId).maybeSingle()
        : supabase.from('apostilas').select('*').eq('id', id).maybeSingle());
      return { ...result, data, error: null } as T;
    }
    if (String(result.error?.code ?? '') === '40001') return result;
    if (!isTransientError(result.error)) return result;
  }
  return result;
}

export async function saveApostilaWithRevision(draft: ApostilaPersistenceDraft) {
  return runSaveWithRecovery(
    () => supabase.rpc('save_apostila' as any, {
      _apostila_id: draft.apostilaId,
      _expected_revision: draft.expectedRevision,
      _title: draft.title,
      _category: draft.category,
      _content: draft.content,
      _published: draft.published,
      _semester: draft.semester,
      _course: draft.course,
      _saved_date: draft.savedDate,
    } as any),
    draft.apostilaId,
    draft,
  );
}

export async function saveApostilaPageWithRevision(draft: ApostilaPagePersistenceDraft) {
  return runSaveWithRecovery(
    () => supabase.rpc('save_apostila_page' as any, {
      _page_id: draft.pageId,
      _apostila_id: draft.apostilaId,
      _expected_revision: draft.expectedRevision,
      _title: draft.title,
      _content: draft.content,
      _saved_date: draft.savedDate,
    } as any),
    draft.pageId,
    draft,
    draft.apostilaId,
  );
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
