// Hook leve que retorna semestre + curso do aluno logado.
// Cacheado via React Query (5 min) — usado para filtrar apostilas pelo
// semestre que o aluno está cursando.
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseCode } from '@/lib/subject-semester-map';

export interface UserProfileLite {
  semester: number | null;
  course: CourseCode | null;
  full_name: string;
  ra: string | null;
}

export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', 'lite', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<UserProfileLite | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('semester, course, full_name, ra')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error || !data) return null;
      const course = (data.course as CourseCode | null) ?? null;
      return {
        semester: data.semester ?? null,
        course: course && ['CC', 'SI', 'EC'].includes(course) ? course : null,
        full_name: data.full_name || '',
        ra: data.ra ?? null,
      };
    },
  });
}
