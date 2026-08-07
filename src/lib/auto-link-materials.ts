import { supabase } from '@/integrations/supabase/client';
import { materialDedupeKey } from '@/lib/material-dedupe';

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

function scoreMatch(
  mat: MaterialLite,
  apostilaTitle: string,
  apostilaCategory: string,
  catMap: Map<string, string>
): { score: number; reason: string } {
  if (mat.category_id) {
    const catName = catMap.get(mat.category_id);
    if (catName && normalize(catName) === normalize(apostilaCategory)) {
      return { score: 100, reason: 'Mesma disciplina' };
    }
  }

  const apostilaKeywords = extractKeywords(`${apostilaTitle} ${apostilaCategory}`);
  const materialText = normalize(`${mat.title} ${mat.description || ''}`);
  const materialKeywords = extractKeywords(`${mat.title} ${mat.description || ''}`);
  const apostilaText = normalize(`${apostilaTitle} ${apostilaCategory}`);

  let matches = 0;
  for (const kw of apostilaKeywords) {
    if (materialText.includes(kw)) matches++;
  }
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

  const materialById = new Map((materials || []).map((m) => [m.id, m]));
  const alreadyLinked = new Set((existingLinks || []).map(l => l.material_id));
  const alreadyLinkedKeys = new Set(
    (existingLinks || [])
      .map((link) => materialById.get(link.material_id))
      .filter(Boolean)
      .map((material) => materialDedupeKey(material!)),
  );
  const catMap = new Map((categories || []).map(c => [c.id, c.name]));

  return { apostila, materials: materials || [], catMap, alreadyLinked, alreadyLinkedKeys, existingCount: (existingLinks || []).length };
}

export async function getSuggestedMaterials(apostilaId: string): Promise<{
  apostilaTitle: string;
  suggestions: MaterialMatch[];
  others: MaterialLite[];
}> {
  const ctx = await fetchContext(apostilaId);
  if (!ctx) return { apostilaTitle: '', suggestions: [], others: [] };

  const suggestions: MaterialMatch[] = [];
  const others: MaterialLite[] = [];
  const seenAvailableKeys = new Set<string>();

  for (const mat of ctx.materials) {
    const key = materialDedupeKey(mat);
    if (ctx.alreadyLinked.has(mat.id) || ctx.alreadyLinkedKeys.has(key) || seenAvailableKeys.has(key)) continue;
    seenAvailableKeys.add(key);

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

export async function autoLinkApostila(apostilaId: string, minScore = 20): Promise<AutoLinkResult> {
  const ctx = await fetchContext(apostilaId);
  if (!ctx) {
    throw new Error('Apostila não encontrada ou sem acesso.');
  }

  const toLink: string[] = [];
  const seenKeys = new Set(ctx.alreadyLinkedKeys);

  for (const mat of ctx.materials) {
    const key = materialDedupeKey(mat);
    if (ctx.alreadyLinked.has(mat.id) || seenKeys.has(key)) continue;
    const { score } = scoreMatch(mat, ctx.apostila.title, ctx.apostila.category, ctx.catMap);
    if (score >= minScore) {
      toLink.push(mat.id);
      seenKeys.add(key);
    }
  }

  if (toLink.length > 0) {
    const rows = toLink.map((materialId, i) => ({
      apostila_id: apostilaId,
      material_id: materialId,
      sort_order: ctx.existingCount + i,
    }));
    const { error } = await supabase.from('apostila_materials').insert(rows);
    if (error) {
      console.error('[AutoLink] Insert failed:', error);
      throw new Error(`Erro ao vincular ${rows.length} materiais: ${error.message}`);
    }
  }

  return { linked: toLink.length, apostilaTitle: ctx.apostila.title };
}

export async function linkMaterials(apostilaId: string, materialIds: string[]): Promise<number> {
  if (materialIds.length === 0) return 0;

  const uniqueRequestedIds = Array.from(new Set(materialIds));
  const [{ data: existing }, { data: requestedMaterials }] = await Promise.all([
    supabase.from('apostila_materials').select('material_id, sort_order').eq('apostila_id', apostilaId),
    supabase.from('materials').select('id, title, description, category_id').in('id', uniqueRequestedIds),
  ]);

  const requestedById = new Map((requestedMaterials || []).map((material) => [material.id, material]));
  const existingIds = new Set((existing || []).map(e => e.material_id));

  const existingMaterialIds = Array.from(existingIds);
  const { data: existingMaterials } = existingMaterialIds.length
    ? await supabase.from('materials').select('id, title, description, category_id').in('id', existingMaterialIds)
    : { data: [] as MaterialLite[] };

  const linkedKeys = new Set((existingMaterials || []).map((material) => materialDedupeKey(material)));
  const newIds: string[] = [];

  for (const id of uniqueRequestedIds) {
    if (existingIds.has(id)) continue;
    const material = requestedById.get(id);
    if (!material) continue;
    const key = materialDedupeKey(material);
    if (linkedKeys.has(key)) continue;
    linkedKeys.add(key);
    newIds.push(id);
  }

  if (newIds.length === 0) return 0;

  const baseOrder = (existing || []).length;
  const rows = newIds.map((materialId, i) => ({
    apostila_id: apostilaId,
    material_id: materialId,
    sort_order: baseOrder + i,
  }));
  const { error } = await supabase.from('apostila_materials').insert(rows);
  if (error) {
    console.error('[LinkMaterials] Insert failed:', error);
    throw new Error(`Erro ao vincular materiais selecionados: ${error.message}`);
  }
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

function unifyContent(apostilas: { title: string; content: string | null }[]): string {
  const seenParagraphs = new Set<string>();
  const seenSectionHeaders = new Set<string>();
  const REPEATABLE_SECTIONS = /^(?:#{1,6}\s*)?(introdução|introducao|conclusão|conclusao|referências|referencias|bibliografia|sumário|sumario|índice|indice)\s*:?\s*$/i;

  const allParagraphs: string[] = [];

  for (const ap of apostilas) {
    let content = (ap.content || '').trim();
    if (!content) continue;

    const titleNorm = ap.title.trim().toLowerCase();
    const lines = content.split('\n');
    while (lines.length > 0) {
      const first = lines[0].trim().replace(/^#{1,6}\s*/, '').replace(/[*_`]/g, '').toLowerCase();
      if (!first || first === titleNorm) { lines.shift(); continue; }
      break;
    }
    content = lines.join('\n').trim();

    content = content
      .split('\n')
      .filter(line => !/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line))
      .join('\n');

    const paragraphs = content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

    for (const p of paragraphs) {
      const normalized = p.toLowerCase().replace(/\s+/g, ' ').trim();
      if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(p.trim())) continue;

      if (REPEATABLE_SECTIONS.test(p.trim())) {
        if (seenSectionHeaders.has(normalized)) continue;
        seenSectionHeaders.add(normalized);
      }

      if (normalized.length > 40) {
        if (seenParagraphs.has(normalized)) continue;
        seenParagraphs.add(normalized);
      }

      allParagraphs.push(p);
    }
  }

  return allParagraphs.join('\n\n');
}

export async function mergeApostilas(
  targetId: string,
  sourceIds: string[],
  newTitle?: string
): Promise<{ mergedCount: number; exercisesMoved: number; materialsMoved: number }> {
  const allIds = [targetId, ...sourceIds.filter(id => id !== targetId)];

  const { data: apostilas } = await supabase
    .from('apostilas').select('id, title, content, category').in('id', allIds);

  if (!apostilas || apostilas.length < 2) {
    throw new Error('Selecione ao menos 2 apostilas para mesclar.');
  }

  const target = apostilas.find(a => a.id === targetId);
  if (!target) throw new Error('Apostila principal não encontrada.');

  const sources = apostilas.filter(a => a.id !== targetId);

  const targetCat = target.category.trim().toLowerCase();
  const mismatch = sources.find(s => s.category.trim().toLowerCase() !== targetCat);
  if (mismatch) {
    throw new Error(`Só é possível mesclar apostilas da mesma matéria. "${mismatch.title}" é de "${mismatch.category}".`);
  }

  const mergedContent = unifyContent([target, ...sources]);

  const sourceIdList = sources.map(s => s.id);
  const { data: srcExercises } = await supabase
    .from('exercises').select('id').in('apostila_id', sourceIdList);
  const exercisesMoved = srcExercises?.length || 0;
  if (exercisesMoved > 0) {
    await supabase.from('exercises').update({ apostila_id: targetId }).in('apostila_id', sourceIdList);
  }

  const { data: targetLinks } = await supabase
    .from('apostila_materials').select('material_id, sort_order').eq('apostila_id', targetId);
  const targetMatIds = new Set((targetLinks || []).map(l => l.material_id));
  const baseOrder = (targetLinks || []).length;

  const { data: srcLinks } = await supabase
    .from('apostila_materials').select('id, material_id').in('apostila_id', sourceIdList);

  let materialsMoved = 0;
  if (srcLinks && srcLinks.length > 0) {
    const allMaterialIds = Array.from(new Set([...(targetLinks || []).map(l => l.material_id), ...srcLinks.map(l => l.material_id)]));
    const { data: materials } = await supabase.from('materials').select('id, title, description, category_id').in('id', allMaterialIds);
    const materialById = new Map((materials || []).map((material) => [material.id, material]));
    const targetKeys = new Set(
      (targetLinks || [])
        .map((link) => materialById.get(link.material_id))
        .filter(Boolean)
        .map((material) => materialDedupeKey(material!)),
    );

    const seenInSrc = new Set<string>();
    const toInsert: { apostila_id: string; material_id: string; sort_order: number }[] = [];
    for (const link of srcLinks) {
      const material = materialById.get(link.material_id);
      const key = material ? materialDedupeKey(material) : link.material_id;
      if (targetMatIds.has(link.material_id) || targetKeys.has(key) || seenInSrc.has(key)) continue;
      seenInSrc.add(key);
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
    await supabase.from('apostila_materials').delete().in('apostila_id', sourceIdList);
  }

  await supabase.from('apostilas').update({
    content: mergedContent,
    ...(newTitle && newTitle.trim() ? { title: newTitle.trim() } : {}),
  }).eq('id', targetId);

  await supabase.from('apostilas').delete().in('id', sourceIdList);

  return { mergedCount: sources.length, exercisesMoved, materialsMoved };
}
