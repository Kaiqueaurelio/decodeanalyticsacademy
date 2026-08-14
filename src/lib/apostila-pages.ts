import { supabase } from '@/integrations/supabase/client';

export interface ApostilaPage {
  id: string;
  apostila_id: string;
  title: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export async function createApostilaPage(apostilaId: string, userId: string) {
  const { data: existing, error: readError } = await (supabase.from('apostila_pages' as any) as any)
    .select('position')
    .eq('apostila_id', apostilaId)
    .order('position', { ascending: false })
    .limit(1);
  if (readError) throw readError;

  const position = existing?.[0]?.position ?? -1;
  const date = new Intl.DateTimeFormat('pt-BR').format(new Date());
  const { data, error } = await (supabase.from('apostila_pages' as any) as any)
    .insert({ apostila_id: apostilaId, title: `Nova Página — ${date}`, content: '', position: position + 1, created_by: userId })
    .select('*')
    .single();
  if (error) throw error;
  return data as ApostilaPage;
}
