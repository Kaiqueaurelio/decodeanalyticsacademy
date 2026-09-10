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
  const result = await supabase.rpc('save_apostila' as any, {
    _apostila_id: draft.apostilaId,
    _expected_revision: draft.expectedRevision,
    _title: draft.title,
    _category: draft.category,
    _content: draft.content,
    _published: draft.published,
    _semester: draft.semester,
    _course: draft.course,
    _saved_date: draft.savedDate,
  } as any);
  return confirmSavedDraft(result, draft.apostilaId, draft);
}

export async function saveApostilaPageWithRevision(draft: ApostilaPagePersistenceDraft) {
  const result = await supabase.rpc('save_apostila_page' as any, {
    _page_id: draft.pageId,
    _apostila_id: draft.apostilaId,
    _expected_revision: draft.expectedRevision,
    _title: draft.title,
    _content: draft.content,
    _saved_date: draft.savedDate,
  } as any);
  return confirmSavedDraft(result, draft.pageId, draft, draft.apostilaId);
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
