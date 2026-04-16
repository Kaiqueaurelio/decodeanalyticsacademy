import { supabase } from '@/integrations/supabase/client';

export interface ProfileLite { user_id: string; full_name: string; email: string; }

export const handleFromName = (name: string, email: string) => {
  const base = (name || email?.split('@')[0] || 'aluno').toLowerCase();
  return base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 24) || 'aluno';
};

/** Extract @handles from a text body (unique, lowercased). */
export function extractMentionHandles(text: string): string[] {
  const re = /(^|[\s(])@([a-z0-9_]{2,24})/gi;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.add(m[2].toLowerCase());
  return [...out];
}

/**
 * Resolve mentioned handles into recipient profiles, then insert notification rows.
 * Silent on errors (mention notifications are best-effort).
 */
export async function notifyMentions(opts: {
  text: string;
  authorId: string;
  contextType: 'post' | 'reply';
  contextId: string;
}) {
  const handles = extractMentionHandles(opts.text);
  if (!handles.length) return;
  const { data: profiles } = await supabase
    .from('profiles').select('user_id, full_name, email').limit(500);
  const list = (profiles as ProfileLite[]) || [];
  const matched = new Map<string, ProfileLite>();
  for (const p of list) {
    const h = handleFromName(p.full_name, p.email);
    if (handles.includes(h) && p.user_id !== opts.authorId) matched.set(p.user_id, p);
  }
  if (!matched.size) return;
  const snippet = opts.text.slice(0, 140);
  const rows = [...matched.values()].map(p => ({
    recipient_id: p.user_id,
    author_id: opts.authorId,
    context_type: opts.contextType,
    context_id: opts.contextId,
    snippet,
  }));
  await supabase.from('mention_notifications' as any).insert(rows as any);
}
