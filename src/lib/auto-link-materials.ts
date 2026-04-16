import { supabase } from '@/integrations/supabase/client';

const STOPWORDS = new Set([
  'para', 'sobre', 'como', 'guia', 'estudo', 'estudos', 'completo', 'apostila',
  'magica', 'aula', 'curso', 'modulo', 'capitulo', 'parte', 'introducao',
  'fundamentos', 'basico', 'avancado', 'pratica', 'teoria', 'arrebentar',
  'mind', 'audiocast', 'atividade', 'resumo', 'video', 'pdf', 'material',
  'computadores', 'computacao',
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function extractKeywords(text: string, minLen = 4): string[] {
  return normalize(text)
    .split(/[\s\-–—:,;.!?()\/\[\]{}'"`]+/)
    .filter(w => w.length >= minLen)
    .filter(w => !STOPWORDS.has(w));
}

interface AutoLinkResult {
  linked: number;
  apostilaTitle: string;
}

interface MaterialLite {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
}

interface MaterialMatch {
  material: MaterialLite;
  score: number;
  reason: string;
}

/**
 * Score a material against an apostila.
 * Higher score = better match.
 */
function scoreMatch(
  mat: MaterialLite,
  apostilaTitle: string,
  apostilaCategory: string,
  catMap: Map<string, string>
): { score: number; reason: string } {
  // Strategy 1: exact category_id match
  if (mat.category_id) {
    const catName = catMap.get(mat.category_id);
    if (catName && normalize(catName) === normalize(apostilaCategory)) {
      return { score: 100, reason: 'Mesma disciplina' };
    }
  }

  // Strategy 2: bidirectional keyword matching
  const apostilaKeywords = extractKeywords(`${apostilaTitle} ${apostilaCategory}`);
  const materialText = normalize(`${mat.title} ${mat.description || ''}`);
  const materialKeywords = extractKeywords(`${mat.title} ${mat.description || ''}`);
  const apostilaText = normalize(`${apostilaTitle} ${apostilaCategory}`);

  let matches = 0;
  // apostila keywords found in material text
  for (const kw of apostilaKeywords) {
    if (materialText.includes(kw)) matches++;
  }
  // material keywords found in apostila text
  for (const kw of materialKeywords) {
    if (apostilaText.includes(kw)) matches++;
  }

  if (matches >= 2) return { score: 50 + matches, reason: `${matches} palavras em comum` };
  if (matches === 1) return { score: 20, reason: '1 palavra em comum' };

  return { score: 0, reason: '' };
}

async function fetchContext(apostilaId: string) {
  const { data: apostila } = await supabase
    .from('apostilas').select('id, title, category').eq('id', apostilaId).single();

  if (!apostila) return null;

  const [{ data: materials }, { data: categories }, { data: existingLinks }] = await Promise.all([
    supabase.from('materials').select('id, title, description, category_id'),
    supabase.from('categories').select('id, name'),
    supabase.from('apostila_materials').select('material_id').eq('apostila_id', apostilaId),
  ]);

  const alreadyLinked = new Set((existingLinks || []).map(l => l.material_id));
  const catMap = new Map((categories || []).map(c => [c.id, c.name]));

  return { apostila, materials: materials || [], catMap, alreadyLinked, existingCount: (existingLinks || []).length };
}

/**
 * Get suggested materials with scores (for manual review dialog).
 */
export async function getSuggestedMaterials(apostilaId: string): Promise<{
  apostilaTitle: string;
  suggestions: MaterialMatch[];
  others: MaterialLite[];
}> {
  const ctx = await fetchContext(apostilaId);
  if (!ctx) return { apostilaTitle: '', suggestions: [], others: [] };

  const suggestions: MaterialMatch[] = [];
  const others: MaterialLite[] = [];

  for (const mat of ctx.materials) {
    if (ctx.alreadyLinked.has(mat.id)) continue;
    const { score, reason } = scoreMatch(mat, ctx.apostila.title, ctx.apostila.category, ctx.catMap);
    if (score > 0) {
      suggestions.push({ material: mat, score, reason });
    } else {
      others.push(mat);
    }
  }

  suggestions.sort((a, b) => b.score - a.score);
  return { apostilaTitle: ctx.apostila.title, suggestions, others };
}

/**
 * Auto-link materials with score > threshold.
 */
export async function autoLinkApostila(apostilaId: string, minScore = 20): Promise<AutoLinkResult> {
  const ctx = await fetchContext(apostilaId);
  if (!ctx) return { linked: 0, apostilaTitle: '' };

  const toLink: string[] = [];
  for (const mat of ctx.materials) {
    if (ctx.alreadyLinked.has(mat.id)) continue;
    const { score } = scoreMatch(mat, ctx.apostila.title, ctx.apostila.category, ctx.catMap);
    if (score >= minScore) toLink.push(mat.id);
  }

  if (toLink.length > 0) {
    const rows = toLink.map((materialId, i) => ({
      apostila_id: apostilaId,
      material_id: materialId,
      sort_order: ctx.existingCount + i,
    }));
    await supabase.from('apostila_materials').insert(rows);
  }

  return { linked: toLink.length, apostilaTitle: ctx.apostila.title };
}

/**
 * Manually link a list of material IDs to an apostila.
 */
export async function linkMaterials(apostilaId: string, materialIds: string[]): Promise<number> {
  if (materialIds.length === 0) return 0;
  const { data: existing } = await supabase
    .from('apostila_materials').select('material_id, sort_order').eq('apostila_id', apostilaId);
  const existingIds = new Set((existing || []).map(e => e.material_id));
  const newIds = materialIds.filter(id => !existingIds.has(id));
  if (newIds.length === 0) return 0;
  const baseOrder = (existing || []).length;
  const rows = newIds.map((materialId, i) => ({
    apostila_id: apostilaId,
    material_id: materialId,
    sort_order: baseOrder + i,
  }));
  await supabase.from('apostila_materials').insert(rows);
  return newIds.length;
}

export async function autoLinkAll(
  onProgress?: (current: number, total: number, result: AutoLinkResult) => void
): Promise<{ totalLinked: number; apostilasProcessed: number }> {
  const { data: apostilas } = await supabase.from('apostilas').select('id').order('created_at');
  if (!apostilas?.length) return { totalLinked: 0, apostilasProcessed: 0 };

  let totalLinked = 0;
  for (let i = 0; i < apostilas.length; i++) {
    const result = await autoLinkApostila(apostilas[i].id);
    totalLinked += result.linked;
    onProgress?.(i + 1, apostilas.length, result);
  }
  return { totalLinked, apostilasProcessed: apostilas.length };
}

/**
 * Merge multiple apostilas into a target one.
 * - Concatenates content with separators
 * - Moves all exercises to target
 * - Moves all material links to target (deduped)
 * - Deletes the source apostilas
 */
export async function mergeApostilas(
  targetId: string,
  sourceIds: string[],
  newTitle?: string
): Promise<{ mergedCount: number; exercisesMoved: number; materialsMoved: number }> {
  const allIds = [targetId, ...sourceIds.filter(id => id !== targetId)];

  // Fetch all apostilas
  const { data: apostilas } = await supabase
    .from('apostilas').select('id, title, content').in('id', allIds);

  if (!apostilas || apostilas.length < 2) {
    throw new Error('Selecione ao menos 2 apostilas para mesclar.');
  }

  const target = apostilas.find(a => a.id === targetId);
  if (!target) throw new Error('Apostila principal não encontrada.');

  const sources = apostilas.filter(a => a.id !== targetId);

  // 1. Concatenate content — preserve original formatting, no extra headers/separators
  const parts = [target.content || '', ...sources.map(s => s.content || '')]
    .map(c => c.trim())
    .filter(Boolean);
  const mergedContent = parts.join('\n\n');

  // 2. Move exercises
  const sourceIdList = sources.map(s => s.id);
  const { data: srcExercises } = await supabase
    .from('exercises').select('id').in('apostila_id', sourceIdList);
  const exercisesMoved = srcExercises?.length || 0;
  if (exercisesMoved > 0) {
    await supabase.from('exercises').update({ apostila_id: targetId }).in('apostila_id', sourceIdList);
  }

  // 3. Move material links (dedupe)
  const { data: targetLinks } = await supabase
    .from('apostila_materials').select('material_id, sort_order').eq('apostila_id', targetId);
  const targetMatIds = new Set((targetLinks || []).map(l => l.material_id));
  const baseOrder = (targetLinks || []).length;

  const { data: srcLinks } = await supabase
    .from('apostila_materials').select('id, material_id').in('apostila_id', sourceIdList);

  let materialsMoved = 0;
  if (srcLinks && srcLinks.length > 0) {
    const seenInSrc = new Set<string>();
    const toInsert: { apostila_id: string; material_id: string; sort_order: number }[] = [];
    for (const link of srcLinks) {
      if (targetMatIds.has(link.material_id) || seenInSrc.has(link.material_id)) continue;
      seenInSrc.add(link.material_id);
      toInsert.push({
        apostila_id: targetId,
        material_id: link.material_id,
        sort_order: baseOrder + toInsert.length,
      });
    }
    if (toInsert.length > 0) {
      await supabase.from('apostila_materials').insert(toInsert);
      materialsMoved = toInsert.length;
    }
    // Delete old links
    await supabase.from('apostila_materials').delete().in('apostila_id', sourceIdList);
  }

  // 4. Update target with merged content + optional new title
  await supabase.from('apostilas').update({
    content: mergedContent,
    ...(newTitle && newTitle.trim() ? { title: newTitle.trim() } : {}),
  }).eq('id', targetId);

  // 5. Delete source apostilas
  await supabase.from('apostilas').delete().in('id', sourceIdList);

  return { mergedCount: sources.length, exercisesMoved, materialsMoved };
}
