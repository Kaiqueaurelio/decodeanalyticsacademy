import { supabase } from '@/integrations/supabase/client';

export interface ApostilaPage {
  id: string;
  apostila_id: string;
  title: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ChronologyPageSnapshot {
  id: string;
  title: string;
  content: string;
  position: number;
}

export type ChronologyIssueSeverity = 'warning' | 'error';

export interface ChronologyIssue {
  code: string;
  severity: ChronologyIssueSeverity;
  message: string;
  pageId?: string;
  metadata: Record<string, unknown>;
}

export interface ChronologyValidationReport {
  status: 'ok' | 'warning' | 'error';
  issues: ChronologyIssue[];
  dates: string[];
}

const DATE_PATTERN = /\b([0-3]\d)[/.-]([01]\d)[/.-]((?:19|20)\d{2})\b/g;

function toIsoDate(day: string, month: string, year: string): string | null {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function extractChronologyDates(text: string | null | undefined): string[] {
  const dates = new Set<string>();
  const source = text || '';
  for (const match of source.matchAll(DATE_PATTERN)) {
    const isoDate = toIsoDate(match[1], match[2], match[3]);
    if (isoDate) dates.add(isoDate);
  }
  return [...dates].sort();
}

export function validateApostilaChronology(input: {
  title?: string | null;
  content?: string | null;
  pages?: ChronologyPageSnapshot[];
}): ChronologyValidationReport {
  const issues: ChronologyIssue[] = [];
  const mainTitleDates = extractChronologyDates(input.title);
  const mainContentDates = extractChronologyDates(input.content);
  const allDates = new Set([...mainTitleDates, ...mainContentDates]);

  if (mainContentDates.length > 1) {
    issues.push({
      code: 'main_content_multiple_dates',
      severity: 'error',
      message: 'O conteúdo principal contém mais de uma data de aula.',
      metadata: { detectedDates: mainContentDates },
    });
  }

  if (mainTitleDates.length === 1 && mainContentDates.some((date) => date !== mainTitleDates[0])) {
    issues.push({
      code: 'main_title_content_date_mismatch',
      severity: 'error',
      message: 'A data do título não corresponde às datas do conteúdo principal.',
      metadata: { titleDate: mainTitleDates[0], contentDates: mainContentDates },
    });
  }

  let previousDate: string | null = null;
  const orderedPages = [...(input.pages || [])].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));

  for (const page of orderedPages) {
    const titleDates = extractChronologyDates(page.title);
    const contentDates = extractChronologyDates(page.content);

    if (titleDates.length === 0 && contentDates.length > 0) {
      issues.push({
        code: 'page_title_missing_date',
        severity: 'warning',
        message: 'A página contém data no conteúdo, mas não no título.',
        pageId: page.id,
        metadata: { contentDates, title: page.title, position: page.position },
      });
    }

    if (contentDates.length > 1) {
      issues.push({
        code: 'page_content_multiple_dates',
        severity: 'error',
        message: 'Uma única página contém múltiplas datas de aula.',
        pageId: page.id,
        metadata: { contentDates, title: page.title, position: page.position },
      });
    }

    if (titleDates.length === 1 && contentDates.some((date) => date !== titleDates[0])) {
      issues.push({
        code: 'page_title_content_date_mismatch',
        severity: 'error',
        message: 'A data do título da página não corresponde ao conteúdo.',
        pageId: page.id,
        metadata: { titleDate: titleDates[0], contentDates, title: page.title, position: page.position },
      });
    }

    const pageDate = titleDates[0] || (contentDates.length === 1 ? contentDates[0] : null);
    if (pageDate && previousDate && pageDate < previousDate) {
      issues.push({
        code: 'page_dates_out_of_order',
        severity: 'error',
        message: 'As páginas estão fora da ordem cronológica.',
        pageId: page.id,
        metadata: { previousDate, currentDate: pageDate, title: page.title, position: page.position },
      });
    }
    if (pageDate) previousDate = pageDate;
    contentDates.forEach((date) => allDates.add(date));
    titleDates.forEach((date) => allDates.add(date));
  }

  const status = issues.some((issue) => issue.severity === 'error')
    ? 'error'
    : issues.length > 0
      ? 'warning'
      : 'ok';

  return { status, issues, dates: [...allDates].sort() };
}

export function upsertApostilaPage(pages: ApostilaPage[], savedPage: ApostilaPage) {
  const exists = pages.some((page) => page.id === savedPage.id);
  const next = exists
    ? pages.map((page) => page.id === savedPage.id ? savedPage : page)
    : [...pages, savedPage];
  return next.sort((a, b) => a.position - b.position);
}

export async function createApostilaPage(apostilaId: string, userId: string) {
  const { data: existing, error: readError } = await (supabase.from('apostila_pages' as any) as any)
    .select('position')
    .eq('apostila_id', apostilaId)
    .order('position', { ascending: false })
    .limit(1);
  if (readError) throw readError;

  const position = existing?.[0]?.position ?? -1;
  const date = new Intl.DateTimeFormat('pt-BR').format(new Date());

  const { data, error } = await (supabase.from('apostila_pages' as any) as any)
    .insert({
      apostila_id: apostilaId,
      title: `Nova Página — ${date}`,
      content: '',
      position: position + 1,
      created_by: userId,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as ApostilaPage;
}

/** Executa a separação automática por data via RPC */
export async function splitApostilaByDate(
  apostilaId: string, 
  options: { dryRun?: boolean; contentOverride?: string } = {}
): Promise<{ 
  success: boolean; 
  pages_created: number; 
  dates: string[];
  preview?: Array<{ title: string; content: string; date?: string }>;
}> {
  const { data, error } = await supabase.rpc('split_apostila_by_date', {
    _apostila_id: apostilaId,
    _dry_run: options.dryRun || false,
    _content_override: options.contentOverride || null
  });
  
  if (error) {
    console.error('[ApostilaPages] Erro ao separar por data:', error);
    throw error;
  }
  
  return data as any;
}


