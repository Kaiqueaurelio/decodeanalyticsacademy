import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ReadingProgress } from './types';

export function useReadingProgress(bookId: string | undefined, fileType: 'pdf' | 'epub') {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!user || !bookId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .maybeSingle();
      if (active) {
        setProgress(data as ReadingProgress | null);
        setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, [user, bookId]);

  const lastPatch = useRef<{ current_page?: number; location?: string; progress_percentage?: number } | null>(null);

  const persist = async (patch: { current_page?: number; location?: string; progress_percentage?: number }) => {
    if (!user || !bookId) return;
    await supabase.from('reading_progress').upsert({
      user_id: user.id,
      book_id: bookId,
      file_type: fileType,
      ...patch,
    }, { onConflict: 'user_id,book_id' });
  };

  const save = (patch: { current_page?: number; location?: string; progress_percentage?: number }) => {
    if (!user || !bookId) return;
    lastPatch.current = patch;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void persist(patch); }, 600);
  };

  const flush = async () => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (lastPatch.current) await persist(lastPatch.current);
  };

  return { progress, loaded, save, flush };
}
