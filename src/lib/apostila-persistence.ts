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
  return supabase.rpc('save_apostila' as any, {
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
}

export async function saveApostilaPageWithRevision(draft: ApostilaPagePersistenceDraft) {
  return supabase.rpc('save_apostila_page' as any, {
    _page_id: draft.pageId,
    _apostila_id: draft.apostilaId,
    _expected_revision: draft.expectedRevision,
    _title: draft.title,
    _content: draft.content,
    _saved_date: draft.savedDate,
  } as any);
}
