import { supabase } from '@/integrations/supabase/client';

/**
 * Extract meaningful keywords (>4 chars) from a string, lowercased.
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .split(/[\s\-–—:,;.!?()\/\[\]{}]+/)
    .filter(w => w.length > 4)
    .filter(w => !['para', 'sobre', 'como', 'guia', 'estudo', 'estudos', 'completo', 'apostila', 'magica'].includes(w));
}

/**
 * Check if a material title fuzzy-matches an apostila's title or category.
 */
function fuzzyMatch(materialTitle: string, apostilaTitle: string, apostilaCategory: string): boolean {
  const matWords = extractKeywords(materialTitle);
  const targetText = `${apostilaTitle} ${apostilaCategory}`.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // At least one keyword must match
  return matWords.some(word => targetText.includes(word));
}

interface AutoLinkResult {
  linked: number;
  apostilaTitle: string;
}

/**
 * Auto-link materials to a single apostila by category + fuzzy title matching.
 */
export async function autoLinkApostila(apostilaId: string): Promise<AutoLinkResult> {
  // 1. Get the apostila
  const { data: apostila } = await supabase
    .from('apostilas')
    .select('id, title, category')
    .eq('id', apostilaId)
    .single();

  if (!apostila) return { linked: 0, apostilaTitle: '' };

  // 2. Get all materials + categories
  const [{ data: materials }, { data: categories }, { data: existingLinks }] = await Promise.all([
    supabase.from('materials').select('id, title, category_id'),
    supabase.from('categories').select('id, name'),
    supabase.from('apostila_materials').select('material_id').eq('apostila_id', apostilaId),
  ]);

  const alreadyLinked = new Set((existingLinks || []).map(l => l.material_id));
  const catMap = new Map((categories || []).map(c => [c.id, c.name]));

  // 3. Find matching materials
  const toLink: string[] = [];
  
  for (const mat of (materials || [])) {
    if (alreadyLinked.has(mat.id)) continue;

    // Strategy 1: category_id match
    if (mat.category_id) {
      const catName = catMap.get(mat.category_id);
      if (catName && catName.toLowerCase() === apostila.category.toLowerCase()) {
        toLink.push(mat.id);
        continue;
      }
    }

    // Strategy 2: fuzzy title match
    if (fuzzyMatch(mat.title, apostila.title, apostila.category)) {
      toLink.push(mat.id);
    }
  }

  // 4. Insert links
  if (toLink.length > 0) {
    const maxOrder = (existingLinks || []).length;
    const rows = toLink.map((materialId, i) => ({
      apostila_id: apostilaId,
      material_id: materialId,
      sort_order: maxOrder + i,
    }));
    await supabase.from('apostila_materials').insert(rows);
  }

  return { linked: toLink.length, apostilaTitle: apostila.title };
}

/**
 * Auto-link materials to ALL apostilas in batch.
 */
export async function autoLinkAll(
  onProgress?: (current: number, total: number, result: AutoLinkResult) => void
): Promise<{ totalLinked: number; apostilasProcessed: number }> {
  const { data: apostilas } = await supabase
    .from('apostilas')
    .select('id')
    .order('created_at');

  if (!apostilas?.length) return { totalLinked: 0, apostilasProcessed: 0 };

  let totalLinked = 0;
  for (let i = 0; i < apostilas.length; i++) {
    const result = await autoLinkApostila(apostilas[i].id);
    totalLinked += result.linked;
    onProgress?.(i + 1, apostilas.length, result);
  }

  return { totalLinked, apostilasProcessed: apostilas.length };
}
