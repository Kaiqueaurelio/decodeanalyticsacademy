/**
 * useContinueWhereLeft — agrega os últimos pontos onde o aluno parou de estudar:
 *  • Apostilas (último chat com a IA na apostila → indica que estava lendo/perguntando)
 *  • Apostilas (última anotação criada)
 *  • Apostilas (última sessão de Pomodoro com apostila vinculada)
 *  • Livros / EPUBs (reading_progress)
 *
 * Retorna até 3 itens distintos por apostila/livro, ordenados por recência.
 * Usado no card "Continue de onde parou" no Dashboard.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ContinueItem =
  | {
      kind: 'apostila';
      id: string;            // apostila_id
      title: string;
      category?: string | null;
      lastAt: string;        // ISO
      reason: 'chat' | 'annotation' | 'pomodoro';
      progress?: number;
      lessonTitle?: string | null;
      completedLessons?: number;
      totalLessons?: number;
      href: string;
    }
  | {
      kind: 'book';
      id: string;            // book_id
      title: string;
      category?: string | null;
      lastAt: string;
      reason: 'reading';
      progress?: number;
      page?: number | null;
      href: string;
    };

export function useContinueWhereLeft(limit = 3) {
  const { user } = useAuth();
  const [items, setItems] = useState<ContinueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    let active = true;

    (async () => {
      setLoading(true);
      try {
        const [lessonProgress, chats, annots, pomos, reads] = await Promise.all([
          supabase
            .from('apostila_lesson_progress')
            .select('lesson_id, status, updated_at, apostila_lessons(title, apostila_chapters(title, apostila_modules(apostila_id, apostilas(title, category))))')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(500),
          supabase
            .from('apostila_chats')
            .select('apostila_id, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('annotations')
            .select('apostila_id, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(10),
          supabase
            .from('pomodoro_sessions')
            .select('apostila_id, created_at')
            .eq('user_id', user.id)
            .not('apostila_id', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('reading_progress')
            .select('book_id, updated_at, current_page, progress_percentage')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(10),
        ]);

        const failedRequest = [lessonProgress, chats, annots, pomos, reads].find((response) => response.error);
        if (failedRequest?.error) throw failedRequest.error;

        // Aggregate latest per apostila across all study sources.
        const apostilaMap = new Map<string, { lastAt: string; reason: ContinueItem['reason'] extends infer R ? R : never }>();
        const push = (id: string | null | undefined, when: string, reason: 'chat' | 'annotation' | 'pomodoro') => {
          if (!id || !when) return;
          const prev = apostilaMap.get(id);
          if (!prev || new Date(when) > new Date(prev.lastAt as string)) {
            apostilaMap.set(id, { lastAt: when, reason });
          }
        };
        chats.data?.forEach((r: any) => push(r.apostila_id, r.created_at, 'chat'));
        annots.data?.forEach((r: any) => push(r.apostila_id, r.updated_at, 'annotation'));
        pomos.data?.forEach((r: any) => push(r.apostila_id, r.created_at, 'pomodoro'));

        const structuredProgress = new Map<string, {
          title: string;
          category: string | null;
          lessonId: string;
          lessonTitle: string;
          lastAt: string;
          completed: number;
          total: number;
        }>();

        for (const row of lessonProgress.data || []) {
          const lesson = (row as any).apostila_lessons;
          const chapter = lesson?.apostila_chapters;
          const module = chapter?.apostila_modules;
          const apostila = module?.apostilas;
          const apostilaId = module?.apostila_id;
          if (!apostilaId || !apostila) continue;

          const existing = structuredProgress.get(apostilaId);
          structuredProgress.set(apostilaId, {
            title: apostila.title,
            category: apostila.category || null,
            lessonId: existing?.lessonId || (row as any).lesson_id,
            lessonTitle: existing?.lessonTitle || lesson.title,
            lastAt: existing?.lastAt || (row as any).updated_at,
            completed: (existing?.completed || 0) + ((row as any).status === 'completed' ? 1 : 0),
            total: (existing?.total || 0) + 1,
          });
        }

        const apostilaIds = Array.from(apostilaMap.keys()).slice(0, 6);
        const bookIds = (reads.data || []).map((r: any) => r.book_id).slice(0, 6);

        const [apResp, bkResp] = await Promise.all([
          apostilaIds.length
            ? supabase.from('apostilas').select('id, title, category').in('id', apostilaIds)
            : Promise.resolve({ data: [] as any[] }),
          bookIds.length
            ? supabase.from('books').select('id, title, author').in('id', bookIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);
        const apMap = new Map((apResp.data || []).map((a: any) => [a.id, a]));
        const bkMap = new Map((bkResp.data || []).map((b: any) => [b.id, b]));

        const merged: ContinueItem[] = [];

        for (const [apostilaId, info] of structuredProgress.entries()) {
          merged.push({
            kind: 'apostila',
            id: apostilaId,
            title: info.title,
            category: info.category,
            lastAt: info.lastAt,
            reason: 'annotation',
            progress: info.total > 0 ? Math.round((info.completed / info.total) * 100) : 0,
            lessonTitle: info.lessonTitle,
            completedLessons: info.completed,
            totalLessons: info.total,
            href: `/apostila/${apostilaId}/read?lesson=${encodeURIComponent(info.lessonId)}`,
          });
        }

        for (const [aid, info] of apostilaMap.entries()) {
          if (structuredProgress.has(aid)) continue;
          const ap: any = apMap.get(aid);
          if (!ap) continue;
          merged.push({
            kind: 'apostila',
            id: aid,
            title: ap.title,
            category: ap.category,
            lastAt: info.lastAt as string,
            reason: info.reason as 'chat' | 'annotation' | 'pomodoro',
            href: `/apostila/${aid}`,
          });
        }
        for (const r of reads.data || []) {
          const bk: any = bkMap.get((r as any).book_id);
          if (!bk) continue;
          merged.push({
            kind: 'book',
            id: (r as any).book_id,
            title: bk.title,
            category: bk.author || null,
            lastAt: (r as any).updated_at,
            reason: 'reading',
            progress: Number((r as any).progress_percentage || 0),
            page: (r as any).current_page,
            href: `/livros?open=${(r as any).book_id}`,
          });
        }

        merged.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

        if (active) setItems(merged.slice(0, limit));
      } catch (e) {
        console.warn('[useContinueWhereLeft] error', e);
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, limit]);

  return { items, loading };
}
