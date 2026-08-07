export interface MaterialIdentity {
  id?: string | null;
  title?: string | null;
  type?: string | null;
  file_url?: string | null;
  file_path?: string | null;
}

export function normalizeMaterialTitle(title?: string | null): string {
  return (title || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/\b(copia|copy|duplicado|duplicate|final|novo|new)\b/g, ' ')
    .replace(/\s*\(\d+\)\s*$/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function materialDedupeKey(material: MaterialIdentity): string {
  const title = normalizeMaterialTitle(material.title);
  return title || material.file_path || material.file_url || material.id || '';
}

export function dedupeByMaterialName<T>(items: T[], getMaterial: (item: T) => MaterialIdentity): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];

  for (const item of items) {
    const key = materialDedupeKey(getMaterial(item));
    if (!key) {
      unique.push(item);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  return unique;
}

export function duplicateMaterialLinkIds<T extends { id: string }>(
  items: T[],
  getMaterial: (item: T) => MaterialIdentity,
): string[] {
  const seen = new Set<string>();
  const duplicateIds: string[] = [];

  for (const item of items) {
    const key = materialDedupeKey(getMaterial(item));
    if (!key) continue;
    if (seen.has(key)) duplicateIds.push(item.id);
    else seen.add(key);
  }

  return duplicateIds;
}
