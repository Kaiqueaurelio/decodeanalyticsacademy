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
  // O formato pode ser:
  // placeholder-6-1 -> [placeholder, 6, 1]
  // placeholder-admin-6-1 -> [placeholder, admin, 6, 1]
  // placeholder-admin-dash-6-1 -> [placeholder, admin, dash, 6, 1]
  
  // Pegamos os dois últimos números, que representam semestre e index na Grade Acadêmica
  const numParts = parts.filter(p => /^\d+$/.test(p)).map(p => parseInt(p, 10));
  
  if (numParts.length >= 2) {
    // Pegamos os dois últimos
    const index = numParts[numParts.length - 1];
    const semester = numParts[numParts.length - 2];
    
    const subjects = BY_SEMESTER[semester];
    const title = subjects && subjects[index] !== undefined ? subjects[index] : null;
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

  // Verifica se já existe uma apostila com esse título e semestre no banco (para evitar duplicidade)
  const query = supabase
    .from('apostilas')
    .select('id')
    .eq('title', cleanTitle);
    
  if (semester !== null) {
    query.eq('semester', semester);
  }

  const { data: existing } = await query.maybeSingle();

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
      published: true,
      status: 'liberada',
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
