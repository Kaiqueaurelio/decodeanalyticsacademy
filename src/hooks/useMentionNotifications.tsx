import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AtSign } from 'lucide-react';
import { createElement } from 'react';

interface MentionRow {
  id: string;
  recipient_id: string;
  author_id: string;
  context_type: string;
  context_id: string;
  snippet: string;
  read: boolean;
  created_at: string;
}

export function useMentionNotifications() {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setUnreadCount(0); return; }
    const { count } = await supabase
      .from('mention_notifications' as any)
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('read', false);
    setUnreadCount(count || 0);
  }, [user]);

  // Auto-mark read when on /comunidade
  useEffect(() => {
    if (!user) return;
    if (location.pathname === '/comunidade' && unreadCount > 0) {
      supabase.from('mention_notifications' as any)
        .update({ read: true } as any)
        .eq('recipient_id', user.id)
        .eq('read', false)
        .then(() => setUnreadCount(0));
    }
  }, [location.pathname, user, unreadCount]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`mentions:${user.id}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mention_notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const row = payload.new as MentionRow;
          // Get author name
          const { data: prof } = await supabase
            .from('profiles').select('full_name, email')
            .eq('user_id', row.author_id).maybeSingle();
          const author = (prof?.full_name || prof?.email?.split('@')[0] || 'Alguém');
          toast(`${author} mencionou você`, {
            description: row.snippet,
            icon: createElement(AtSign, { className: 'h-4 w-4 text-primary' }),
            action: location.pathname === '/comunidade' ? undefined : {
              label: 'Ver',
              onClick: () => { window.location.href = '/comunidade'; },
            },
          });
          if (location.pathname !== '/comunidade') {
            setUnreadCount(c => c + 1);
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, location.pathname]);

  return { unreadCount, refresh };
}
