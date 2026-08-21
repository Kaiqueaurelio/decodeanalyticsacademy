import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { NotionSubjectDetail } from '@/components/notion/NotionSubjectDetail';
import { GabaritoSection } from '@/components/GabaritoSection';
import { PageSkeleton } from '@/components/PageSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { guessSemesterFromCategory } from '@/lib/subject-semester-map';
import { formatApostilaDate, getApostilaPageSavedDate, isMissingApostilaPageSavedDateColumn } from '@/lib/apostila-pages';

function sortApostilasDeterministically(apostilas: any[]) {
  return [...apostilas].sort((a, b) => {
    const contentDiff = (b.content || '').length - (a.content || '').length;
    if (contentDiff !== 0) return contentDiff;

    const updatedDiff = String(b.updated_at || '').localeCompare(String(a.updated_at || ''));
    if (updatedDiff !== 0) return updatedDiff;

    return String(a.id).localeCompare(String(b.id));
  });
}

function subjectKey(s: string) {
  if (!s) return '';
  return s.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');
}

const SubjectPage = () => {
  // O parâmetro na rota é :id, mas em outros lugares é referenciado como category
  const { id = '' } = useParams();
  const decodedCategory = decodeURIComponent(id).trim();
  console.log(`[SubjectPage] Rendered for ID/Category: "${decodedCategory}"`);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!decodedCategory) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const targetKey = subjectKey(decodedCategory);
      const targetId = decodedCategory.toLowerCase();
      
      console.log(`[SubjectPage] Fetching apostilas... Target: "${targetKey}" or ID "${targetId}"`);

      const { data: allApostilas, error } = await supabase
        .from('apostilas')
        .select('id, title, category, cover_url, semester, source_type, content, updated_at')
        .eq('published', true);

      if (error) {
        console.error("[SubjectPage] Error fetching apostilas:", error);
      }

      if (!alive) return;

      const matches = (allApostilas || []).filter(ap => {
        const apId = ap.id.toLowerCase();
        const apTitleKey = subjectKey(ap.title || '');
        const apCatKey = subjectKey(ap.category || '');
        
        // 1. Match por ID (UUID)
        if (apId === targetId) return true;
        
        // 2. Match por categoria exata (deve bater com o folder do dashboard)
        if (apCatKey === targetKey) return true;

        // 3. Match por título exato
        if (apTitleKey === targetKey) return true;
        
        // 4. Match parcial resiliente para Mobile / Sistemas Operacionais
        const isMobileOrSO = targetKey.includes('mobile') || targetKey.includes('sistemasoperacionais') || targetKey.includes('operacionais');
        if (isMobileOrSO) {
          if (apTitleKey.includes('mobile') || apTitleKey.includes('operacionais') || apCatKey.includes('mobile')) return true;
        }

        return (targetKey.length > 5 && (apTitleKey.includes(targetKey) || apCatKey.includes(targetKey)));
      });

      console.log(`[SubjectPage] Total apostilas fetched: ${allApostilas?.length}. Matches found: ${matches.length}. Target key: ${targetKey}`);

      const pagesByApostila = new Map<string, Array<{ id: string; title?: string | null; saved_date: string | null; updated_at?: string | null; created_at?: string | null; position?: number | null }>>();
      const matchIds = matches.map((row) => row.id);
      if (matchIds.length > 0) {
        let pageResult: { data: any[] | null; error: any } = await supabase
          .from('apostila_pages')
          .select('id, apostila_id, title, saved_date, position, updated_at, created_at')
          .in('apostila_id', matchIds)
          .order('position', { ascending: true })
          .order('updated_at', { ascending: false });

        if (pageResult.error && isMissingApostilaPageSavedDateColumn(pageResult.error)) {
          pageResult = await supabase
            .from('apostila_pages')
            .select('id, apostila_id, title, position, updated_at, created_at')
            .in('apostila_id', matchIds)
            .order('position', { ascending: true })
            .order('updated_at', { ascending: false });
        }

        if (!pageResult.error) {
          for (const page of pageResult.data || []) {
            const savedDate = getApostilaPageSavedDate(page);
            const current = pagesByApostila.get(page.apostila_id) || [];
            current.push({
              id: page.id,
              title: page.title,
              saved_date: savedDate,
              updated_at: page.updated_at,
              created_at: page.created_at,
              position: page.position,
            });
            pagesByApostila.set(page.apostila_id, current);
          }
        }
      }

      const normalizedRows = matches.flatMap((row) => {
        const pages = pagesByApostila.get(row.id) || [];
        const displayRows = pages.length > 0
          ? pages.map((page) => ({
              ...row,
              page_id: page.id,
              page_title: page.title,
              page_position: page.position,
              saved_date: page.saved_date,
            }))
          : [{
              ...row,
              page_id: null,
              page_title: null,
              page_position: null,
              saved_date: getApostilaPageSavedDate(row),
            }];

        return displayRows.map((displayRow) => ({
          ...displayRow,
          semester: row.semester ?? guessSemesterFromCategory(row.category) ?? guessSemesterFromCategory(decodedCategory) ?? 1,
        }));
      }).sort((a, b) => String(b.saved_date || '').localeCompare(String(a.saved_date || '')) || String(a.title || '').localeCompare(String(b.title || '')));

      setRows(sortApostilasDeterministically(normalizedRows));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [decodedCategory]);

  const handleOpenApostila = (subject: any) => {
    navigate(`/apostila/${subject.id}`);
  };

  if (loading) return <PageSkeleton />;

  const subjectData = rows[0] ? {
    id: rows[0].id,
    title: decodedCategory || rows[0].category || rows[0].title,
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
        title: 'Materiais de Estudo',
        documents: rows.map((row) => ({
          id: `${row.id}:${row.page_id || row.saved_date || 'root'}`,
          title: row.page_title?.trim() || row.title || 'Caderno de Estudos',
          dateLabel: formatApostilaDate(row.saved_date),
          type: 'exam_review' as const,
          onClick: () => row.page_id
            ? navigate(`/reader/${row.id}?lesson=page:${row.page_id}`)
            : handleOpenApostila(row),
        })),
      },
    ],
  } : {
    id: 'placeholder',
    title: decodedCategory || 'Disciplina',
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
      <div className="w-full max-w-5xl mx-auto mt-6 pb-24">
        <GabaritoSection subject={decodedCategory} />
      </div>
    </div>
  );
};

export default SubjectPage;
