import { supabase } from "@/integrations/supabase/client";

export async function logSecurityEvent(eventType: string, resourceId?: string, metadata: any = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      event_type: eventType,
      resource_id: resourceId,
      metadata: {
        ...metadata,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error logging security event:', error);
  }
}
