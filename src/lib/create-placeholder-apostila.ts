import { supabase } from '@/integrations/supabase/client';
import { BY_SEMESTER } from '@/lib/subject-semester-map';

export interface PlaceholderApostilaItem { id?: string; title: string; category?: string | null; semester?: number | null; course?: any; teacher?: string | null; }

export function parsePlaceholderId(id: string): { semester: number; index: number; title: string | null } | null {
  if (!id || !id.startsWith('placeholder')) return null;
  const nums = id.split('-').filter((p) => /^\d+$/.test(p)).map(Number);
  if (nums.length < 2) return null;
  const index = nums[nums.length - 1], semester = nums[nums.length - 2];
  const subjects = BY_SEMESTER[semester];
  return { semester, index, title: subjects && subjects[index] !== undefined ? subjects[index] : null };
}

/** Resolve a grade placeholder through the authenticated admin RPC. */
export async function ensureApostilaExists(item: PlaceholderApostilaItem): Promise<string> {
  if (item.id && !item.id.startsWith('placeholder') && !(item as any).isPlaceholder) return item.id;
  let rawTitle = item.title || '';
  let semester = item.semester ?? null;
  if ((!rawTitle || rawTitle.startsWith('placeholder')) && item.id) {
    const parsed = parsePlaceholderId(item.id);
    if (parsed?.title) { rawTitle = parsed.title; if (semester === null) semester = parsed.semester; }
  }
  const cleanTitle = rawTitle.replace(/^\[GRADE\]\s*/i, '').replace(/^Caderno de\s*/i, '').trim();
  if (!cleanTitle) throw new Error('Título da apostila inválido para criação.');

  const { data, error } = await (supabase.rpc as any)('create_apostila', {
    _title: cleanTitle,
    _category: item.category || cleanTitle,
    _semester: semester,
    _content: '',
    _course: item.course ?? null,
    _source_type: 'grade',
  });
  if (!error && data?.id) return data.id;

  // A criação é idempotente do ponto de vista da grade: se outra aba ganhou a corrida,
  // reutilize o registro canônico em vez de criar um segundo caderno.
  let retry = supabase.from('apostilas').select('id').eq('title', cleanTitle);
  if (semester !== null) retry = retry.eq('semester', semester);
  const { data: existing, error: retryError } = await retry.maybeSingle();
  if (!retryError && existing?.id) return existing.id;

  console.error('Erro ao criar apostila a partir do placeholder:', error || retryError);
  throw error || retryError || new Error('Não foi possível criar a apostila.');
}
