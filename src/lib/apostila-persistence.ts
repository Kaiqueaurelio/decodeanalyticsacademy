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

// Persistência direta: as RPCs save_apostila/save_apostila_page não existem no
// banco, então gravamos com update + select para confirmar o conteúdo salvo.
export async function saveApostilaWithRevision(draft: ApostilaPersistenceDraft) {
  const payload = {
    title: draft.title,
    category: draft.category,
    content: draft.content,
    published: draft.published,
    status: draft.published ? 'liberada' : undefined,
    semester: draft.semester,
    course: draft.course,
    saved_date: draft.savedDate,
    updated_at: new Date().toISOString(),
  } as any;
  if (!payload.status) delete payload.status;
  const run = () => supabase.from('apostilas').update(payload).eq('id', draft.apostilaId).select('id, title, content');
  let result: any = await run();
  if (isTransientSaveError(result.error)) {
    const confirmed = await findSavedApostila(draft);
    if (confirmed) return confirmed;
    result = await run();
  }
  return confirmSavedDraft(result, draft.apostilaId, draft);
}

export async function saveApostilaPageWithRevision(draft: ApostilaPagePersistenceDraft) {
  const payload = {
    title: draft.title,
    content: draft.content,
    saved_date: draft.savedDate,
    updated_at: new Date().toISOString(),
  } as any;
  const run = () => supabase.from('apostila_pages').update(payload)
    .eq('id', draft.pageId).eq('apostila_id', draft.apostilaId)
    .select('id, apostila_id, title, content, position, created_at, updated_at, saved_date');
  let result: any = await run();
  if (isTransientSaveError(result.error)) {
    const confirmed = await findSavedPage(draft);
    if (confirmed) return confirmed;
    result = await run();
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
