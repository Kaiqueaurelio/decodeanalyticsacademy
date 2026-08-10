import { supabase } from '@/integrations/supabase/client';
import { BY_SEMESTER } from '@/lib/subject-semester-map';

export interface PlaceholderApostilaItem {
  id?: string;
  title: string;
  category?: string | null;
  semester?: number | null;
  course?: any;
  teacher?: string | null;
}

/**
 * Extrai dados de um ID de placeholder no formato `placeholder-{admin-dash-}{semester}-{idx}`.
 */
export function parsePlaceholderId(id: string): { semester: number; index: number; title: string | null } | null {
  if (!id || !id.startsWith('placeholder')) return null;

  const parts = id.split('-');
  // Exemplos de ID:
  // placeholder-6-1 -> parts: ['placeholder', '6', '1']
  // placeholder-admin-6-1 -> parts: ['placeholder', 'admin', '6', '1']
  // placeholder-admin-dash-6-1 -> parts: ['placeholder', 'admin', 'dash', '6', '1']
  const numParts = parts.map(p => parseInt(p, 10)).filter(n => !isNaN(n));
  if (numParts.length >= 2) {
    const semester = numParts[0];
    const index = numParts[1];
    const subjects = BY_SEMESTER[semester];
    const title = subjects && subjects[index] ? subjects[index] : null;
    return { semester, index, title };
  }
  return null;
}

/**
 * Converte um placeholder da Grade Acadêmica em um registro real na tabela `apostilas`.
 * Se já for um registro real (tem UUID válido e não é placeholder), retorna o ID original.
 */
export async function ensureApostilaExists(item: PlaceholderApostilaItem): Promise<string> {
  // Se não for placeholder (não começa com 'placeholder' e não tem flag isPlaceholder), retorna o ID original
  if (item.id && !item.id.startsWith('placeholder') && !(item as any).isPlaceholder) {
    return item.id;
  }

  // Tenta resolver o título se o item for apenas { id: 'placeholder-...' }
  let rawTitle = item.title || '';
  let semester = item.semester ?? null;

  if ((!rawTitle || rawTitle.startsWith('placeholder')) && item.id) {
    const parsed = parsePlaceholderId(item.id);
    if (parsed && parsed.title) {
      rawTitle = parsed.title;
      if (semester === null) semester = parsed.semester;
    }
  }

  const cleanTitle = rawTitle.replace(/^\[GRADE\]\s*/i, '').replace(/^Caderno de\s*/i, '').trim();
  if (!cleanTitle) {
    throw new Error('Título da apostila inválido para criação.');
  }

  const category = item.category || cleanTitle;
  const course = item.course ?? [];
  const teacher = item.teacher ?? null;

  // Verifica se já existe uma apostila com esse título e categoria no banco (para evitar duplicidade)
  const { data: existing } = await supabase
    .from('apostilas')
    .select('id')
    .eq('title', cleanTitle)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  // Cria a nova apostila no banco de dados Supabase
  const { data, error } = await supabase
    .from('apostilas')
    .insert({
      title: cleanTitle,
      category: category,
      semester: semester,
      course: course,
      teacher: teacher,
      published: false,
      source_type: 'grade',
      content: '',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Erro ao criar apostila a partir do placeholder:', error);
    throw error;
  }

  return data.id;
}
