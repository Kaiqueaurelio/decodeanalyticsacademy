// Helper para resolver URL assinada de arquivos do bucket privado `books`.
// Aceita tanto um path (`user-id/nome.pdf`) quanto uma URL pública legada
// (`https://.../storage/v1/object/public/books/<path>`).
import { supabase } from '@/integrations/supabase/client';

const PUBLIC_MARKER = '/storage/v1/object/public/books/';
const SIGNED_MARKER = '/storage/v1/object/sign/books/';
const EXPIRES_IN = 3600; // 1 hora

function extractPath(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Já é URL assinada válida? devolve como está
  if (trimmed.includes(SIGNED_MARKER)) return null;
  if (trimmed.includes(PUBLIC_MARKER)) {
    return trimmed.split(PUBLIC_MARKER)[1]?.split('?')[0] ?? null;
  }
  // Se começa com http mas não é do nosso bucket, deixa passar (link externo)
  if (/^https?:\/\//i.test(trimmed)) return null;
  return trimmed.replace(/^\/+/, '');
}

export async function signBooksUrl(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const path = extractPath(value);
  if (!path) return value; // já é URL utilizável (assinada ou externa)
  const { data, error } = await supabase.storage.from('books').createSignedUrl(path, EXPIRES_IN);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
