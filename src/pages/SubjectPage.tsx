import { useMemo, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { getSubjectColor } from '@/lib/subject-colors';
import { canonicalSubjectKey, guessSemesterFromCategory, subjectKey } from '@/lib/subject-semester-map';
import { NotionSubjectDetail } from '@/components/notion/NotionSubjectDetail';
import { GlitchLoader } from '@/components/GlitchLoader';

interface ApostilaRow {
  id: string;
  title: string;
  category: string | null;
  cover_url: string | null;
  semester: number | null;
  source_type: string | null;
  content: string | null;
}

function keepMostComplete(rows: ApostilaRow[]) {
  const unique = new Map<string, ApostilaRow>();
  for (const row of rows) {
    const title = subjectKey(row.title);
    const key = `${title}::${canonicalSubjectKey(row.category)}`;
    const current = unique.get(key);
    if (!current || (row.content || '').length > (current.content || '').length) unique.set(key, row);
  }
  return [...unique.values()];
}

export default function SubjectPage() {
  const { user } = useAuth();
  const { category = '' } = useParams();
  const decodedCategory = decodeURIComponent(category);
  const navigate = useNavigate();
  const [rows, setRows] = useState<ApostilaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const targetKey = subjectKey(decodedCategory);
      const targetSemester = guessSemesterFromCategory(decodedCategory);

      const { data } = await supabase
        .from('apostilas')
        .select('id, title, category, cover_url, semester, source_type, content')
        .eq('published', true)
        .order('title', { ascending: true });

      if (!alive) return;

      const normalizedRows = ((data as ApostilaRow[]) || [])
        .map((row) => ({
          ...row,
          semester: row.semester ?? guessSemesterFromCategory(row.category) ?? null,
        }))
        .filter((row) => {
          const rowKey = subjectKey(row.category || '');
          if (rowKey === targetKey) return true;
          if (targetSemester && row.semester === targetSemester && rowKey.includes(targetKey)) return true;
          if (!rowKey && row.title.toLowerCase().includes(targetKey)) return true;
          return false;
        });

      setRows(keepMostComplete(normalizedRows));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [decodedCategory]);

  const subjectData = useMemo(() => {
    const semesterNum = guessSemesterFromCategory(decodedCategory) || 1;
    
    // Mapeamento de professores (mock centralizado para demonstração do estilo Notion)
    const teacherMap: Record<string, string> = {
      'Sistemas Operacionais e Mobile': 'Prof. Anderson Lima',
      'Calculo Numerico Computacional': 'Prof. Jorge Amaral',
      'Pesquisa Operacional': 'Prof. Dr. Ricardo Silva',
      'Arquitetura de Computadores Modernos': 'Prof. Roberto Santos',
      'Inteligencia Artificial': 'Prof. Fabiano Gomes',
      'Redes de Computadores': 'Prof. Sergio Murilo',
      'Banco de Dados': 'Prof. Carlos Oliveira',
      'Engenharia de Software': 'Profa. Ana Paula',
    };

    const handleOpenNotebook = async () => {
      if (!user) return;
      
      // Tenta encontrar ou criar o caderno para esta disciplina
      const { data: existing } = await supabase
        .from('notebooks' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('subject_id', decodedCategory)
        .maybeSingle();

      if (existing) {
        navigate(`/caderno/${(existing as any).id}`);
      } else {
        const { data: created } = await supabase
          .from('notebooks' as any)
          .insert({
            user_id: user.id,
            subject_id: decodedCategory,
            title: decodedCategory,
            semester: `${semesterNum}º Semestre`,
            status: 'Em progresso'
          })
          .select()
          .single();
        
        if (created) {
          navigate(`/caderno/${(created as any).id}`);
        }
      }
    };

    return {
      id: decodedCategory,
      title: decodedCategory,
      coverImage: rows.find(r => r.cover_url)?.cover_url || null,
      classType: 'Híbrido',
      workloadHours: 80,
      thematicAxis: 'Computação',
      formationAxis: 'Ciência da Computação',
      professor: teacherMap[decodedCategory] || 'Professor da Disciplina',
      semester: `${semesterNum}º Semestre`,
      status: (rows.length > 0 ? 'Em progresso' : 'A cursar') as 'Em progresso' | 'A cursar',
      progressValue: rows.length > 0 ? 35 : 0,
      onOpenNotebook: handleOpenNotebook,
      contentSections: rows.length > 0 

        ? rows.map(r => ({
          id: r.id,
          title: r.title,
          documents: [
            { id: `${r.id}-content`, title: 'Caderno de Estudos', type: 'note' as const, onClick: () => navigate(`/apostila/${r.id}`) },
            { id: `${r.id}-summary`, title: 'Resumo para Prova', type: 'summary' as const, onClick: () => navigate(`/apostila/${r.id}/read`) },
            { id: `${r.id}-exercises`, title: 'Lista de Exercícios', type: 'exam_review' as const, onClick: () => navigate(`/exercicios/${r.id}`) }
          ]
        }))
        : [
          {
            id: 'placeholder-intro',
            title: '1. Introdução e Conceitos Base',
            documents: [
              { id: 'placeholder-doc-1', title: 'Cronograma da Disciplina', type: 'calendar' as const },
              { id: 'placeholder-doc-2', title: 'Notas de Aula (Em breve)', type: 'note' as const }
            ]
          },
          {
            id: 'placeholder-materials',
            title: '2. Materiais Complementares',
            documents: []
          }
        ]
    };
  }, [decodedCategory, rows, navigate]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-3 sm:px-6">
        <div className="py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <GlitchLoader text="Carregando Disciplina..." />
            </div>
          ) : (
            <NotionSubjectDetail subject={subjectData as any} />
          )}
        </div>
      </main>
    </div>
  );
}
