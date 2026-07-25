// Hook leve que retorna semestre + curso do aluno logado.
// Cacheado via React Query (5 min) — usado para filtrar apostilas pelo
// semestre que o aluno está cursando.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseCode } from '@/lib/subject-semester-map';

export type ContentScope = 'full' | 'enem_only';

export interface UserProfileLite {
  semester: number | null;
  course: CourseCode | null;
  full_name: string;
  ra: string | null;
  content_scope: ContentScope;
  must_change_password: boolean;
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', 'lite', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<UserProfileLite | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('semester, course, full_name, ra, content_scope, must_change_password' as any)
        .eq('user_id', userId!)
        .maybeSingle();
      if (error || !data) return null;
      const row = data as any;
      const course = (row.course as CourseCode | null) ?? null;
      const scope: ContentScope = row.content_scope === 'enem_only' ? 'enem_only' : 'full';
      return {
        semester: row.semester ?? null,
        course: course && ['CC', 'SI', 'EC'].includes(course) ? course : null,
        full_name: row.full_name || '',
        ra: row.ra ?? null,
        content_scope: scope,
        must_change_password: Boolean(row.must_change_password),
      };
    },
  });
}
