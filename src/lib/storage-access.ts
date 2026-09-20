import { supabase } from '@/integrations/supabase/client';

type StorageBucket = 'materials' | 'books';

function extractPath(value: string, bucket: StorageBucket): string | null {
  const raw = String(value || '').trim();
  if (!raw || raw.startsWith('blob:') || raw.startsWith('data:')) return null;

  try {
    const parsed = new URL(raw);
    const markers = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
    ];
    const marker = markers.find((item) => parsed.pathname.includes(item));
    if (!marker) return null;
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) return null;
    return decodeURIComponent(parsed.pathname.slice(index + marker.length)).replace(/^\/+/, '');
  } catch {
    return null;
  }
}

export function getStorageObjectPath(value: string | null | undefined, bucket: StorageBucket): string | null {
  return value ? extractPath(value, bucket) : null;
}

export function isStoragePublicUrl(value: string | null | undefined, bucket: StorageBucket): boolean {
  return Boolean(value && extractPath(value, bucket));
}

export async function createSignedStorageUrl(
  value: string,
  bucket: StorageBucket,
  expiresIn = 3600,
): Promise<string> {
  const path = extractPath(value, bucket);
  if (!path) return value;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    throw new Error(`Não foi possível liberar o arquivo do bucket ${bucket}.`);
  }
  return data.signedUrl;
}

export async function resolveMaterialContentUrls(content: string): Promise<string> {
  if (!content) return content;

  const publicUrlRe = /https?:\/\/[^\s"'<>]+\/storage\/v1\/object\/public\/materials\/[^\s"'<>)]*/gi;
  const matches = Array.from(new Set(content.match(publicUrlRe) ?? []));
  if (matches.length === 0) return content;

  const resolved = await Promise.all(
    matches.map(async (url) => {
      try {
        const signed = await createSignedStorageUrl(url, 'materials');
        return [url, signed] as const;
      } catch {
        return [url, url] as const;
      }
    }),
  );

  return resolved.reduce((text, [from, to]) => text.split(from).join(to), content);
}
