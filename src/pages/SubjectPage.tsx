import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NotionSubjectDetail } from '@/components/notion/NotionSubjectDetail';
import { PageSkeleton } from '@/components/PageSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { guessSemesterFromCategory } from '@/lib/subject-semester-map';

function keepMostComplete(apostilas: any[]) {
  if (apostilas.length === 0) return [];
  const sorted = [...apostilas].sort((a, b) => {
    const aContentLen = (a.content || '').length;
    const bContentLen = (b.content || '').length;
    return bContentLen - aContentLen;
  });
  return [sorted[0]];
}

function subjectKey(s: string) {
  return s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');
}

const SubjectPage = () => {
  const { category = '' } = useParams();
  const decodedCategory = decodeURIComponent(category).trim();
  console.log(`[SubjectPage] Rendered for category: "${decodedCategory}"`);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const targetKey = subjectKey(decodedCategory);
      const targetId = decodedCategory.toLowerCase(); // Se for um UUID
      
      const { data: allApostilas } = await supabase
        .from('apostilas')
        .select('id, title, category, cover_url, semester, source_type, content')
        .eq('published', true);

      if (!alive) return;

      const matches = (allApostilas || []).filter(ap => {
        const apId = ap.id.toLowerCase();
        const apTitleKey = subjectKey(ap.title || '');
        const apCatKey = subjectKey(ap.category || '');
        
        // Match por ID (UUID)
        if (apId === targetId) return true;
        
        // Match exato de chaves
        if (apTitleKey === targetKey || apCatKey === targetKey) return true;
        
        // Match parcial resiliente para Mobile / Sistemas Operacionais
        const isMobileOrSO = targetKey.includes('mobile') || targetKey.includes('sistemasoperacionais') || targetKey.includes('operacionais');
        if (isMobileOrSO) {
          if (apTitleKey.includes('mobile') || apTitleKey.includes('operacionais') || apCatKey.includes('mobile')) return true;
        }

        return (targetKey.length > 5 && (apTitleKey.includes(targetKey) || apCatKey.includes(targetKey)));
      });

      console.log(`[SubjectPage] Total apostilas fetched: ${allApostilas?.length}. Matches found: ${matches.length}`);

      const normalizedRows = matches.map((row) => ({
        ...row,
        semester: row.semester ?? guessSemesterFromCategory(row.category) ?? guessSemesterFromCategory(decodedCategory) ?? 1,
      }));

      setRows(keepMostComplete(normalizedRows));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [decodedCategory]);

  const handleOpenApostila = (subject: any) => {
    const isMobileSubject = subject.title.toLowerCase().includes('mobile') || subject.category.toLowerCase().includes('mobile');
    
    // Check for explicit "Aprendendo Shell Script" page
    const shellScriptPageId = '59895af2-f618-4713-92de-408b5c27b513';
    
    if (isMobileSubject) {
      navigate(`/apostila/${subject.id}?page=${shellScriptPageId}`);
    } else {
      navigate(`/apostila/${subject.id}`);
    }
  };

  if (loading) return <PageSkeleton />;

  const subjectData = rows[0] ? {
    id: rows[0].id,
    title: rows[0].title,
    coverImage: rows[0].cover_url,
    classType: rows[0].source_type === 'enem' ? 'ENEM' : 'Graduação',
    workloadHours: 80,
    thematicAxis: 'Tecnologia da Informação',
    formationAxis: rows[0].category,
    professor: 'Prof. Coordenador',
    semester: `${rows[0].semester}º Semestre`,
    status: 'Em progresso' as const,
    progressValue: 15,
    onOpenNotebook: () => handleOpenApostila(rows[0]),
    contentSections: [
      {
        id: 'main-content',
        title: 'Material de Estudo',
        documents: [
          { 
            id: 'caderno-estudos', 
            title: 'Caderno de Estudos', 
            type: 'exam_review' as const, 
            onClick: () => handleOpenApostila(rows[0]) 
          }
        ]
      }
    ]
  } : {
    id: 'placeholder',
    title: decodedCategory,
    coverImage: null,
    classType: 'Graduação',
    workloadHours: 0,
    thematicAxis: 'Não catalogado',
    formationAxis: 'Placeholder',
    professor: 'Não atribuído',
    semester: 'A cursar',
    status: 'A cursar' as const,
    progressValue: 0,
    contentSections: []
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <NotionSubjectDetail subject={subjectData} />
    </div>
  );
};

export default SubjectPage;
