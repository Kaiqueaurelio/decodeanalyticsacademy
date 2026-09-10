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

/** Resolve a grade placeholder without creating duplicate apostilas under concurrent clicks. */
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

  const category = item.category || cleanTitle;
  const course = item.course ?? [];
  const teacher = item.teacher ?? null;
  let query = supabase.from('apostilas').select('id').eq('title', cleanTitle);
  if (semester !== null) query = query.eq('semester', semester);
  const { data: existing, error: lookupError } = await query.maybeSingle();
  if (lookupError) throw lookupError;
  if (existing?.id) return existing.id;

  const { data, error } = await supabase.from('apostilas').insert({
    title: cleanTitle,
    category,
    semester,
    course,
    teacher,
    published: true,
    status: 'liberada',
    source_type: 'grade',
    content: '',
    updated_at: new Date().toISOString(),
  }).select('id').single();
  if (error) {
    // Another tab/request may have won the race. Re-read the canonical row before failing.
    if (error.code === '23505') {
      let retry = supabase.from('apostilas').select('id').eq('title', cleanTitle);
      if (semester !== null) retry = retry.eq('semester', semester);
      const { data: winner, error: retryError } = await retry.maybeSingle();
      if (!retryError && winner?.id) return winner.id;
    }
    console.error('Erro ao criar apostila a partir do placeholder:', error);
    throw error;
  }
  return data.id;
}
