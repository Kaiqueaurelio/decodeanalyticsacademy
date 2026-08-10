import { supabase } from '@/integrations/supabase/client';

export type MaintenanceAction = 
  | 'create' 
  | 'update_content' 
  | 'update_status' 
  | 'delete' 
  | 'restore' 
  | 'publish' 
  | 'unpublish' 
  | 'maintenance_mode';

export async function logMaintenance(
  apostilaId: string,
  action: MaintenanceAction,
  details?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    await supabase.from('maintenance_logs').insert({
      apostila_id: apostilaId,
      user_id: user.id,
      user_name: profile?.full_name || user.email,
      action: action,
      details: details,
    });
  } catch (error) {
    console.error('Erro ao registrar log de manutenção:', error);
  }
}
