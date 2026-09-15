import { supabase } from '@/integrations/supabase/client';

export interface ApostilaPage {
  id: string;
  apostila_id: string;
  title: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
  /** Data manual associada à aula/página (YYYY-MM-DD). */
  saved_date?: string | null;
}

export function getLocalDateIso(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Retorna a data local do último salvamento, com fallback para a criação da página. */
export function getApostilaPageSavedDate(input: {
  saved_date?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}): string | null {
  if (input.saved_date && /^\d{4}-\d{2}-\d{2}$/.test(input.saved_date)) return input.saved_date;
  const raw = input.updated_at || input.created_at;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return getLocalDateIso(date);
}

export function isMissingApostilaPageSavedDateColumn(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string; details?: string } | null;
  const text = `${candidate?.code || ''} ${candidate?.message || ''} ${candidate?.details || ''}`.toLowerCase();
  return candidate?.code === '42703' || candidate?.code === 'PGRST204' || text.includes('saved_date');
}

export interface ChronologyPageSnapshot {
  id: string;
  title: string;
  content: string;
  position: number;
  saved_date?: string | null;
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

export function extractApostilaPageDate(input: { title?: string | null; content?: string | null }): string | null {
  const titleDates = extractChronologyDates(input.title);
  if (titleDates.length === 1) return titleDates[0];
  const contentDates = extractChronologyDates(input.content);
  return contentDates.length === 1 ? contentDates[0] : null;
}

export function formatApostilaDate(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Data pendente';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : isoDate;
}

/**
 * Keeps the editorial sequence deterministic when pages have a saved date,
 * while retaining the existing position as the fallback for undated pages.
 */
export function sortApostilaPagesChronologically<T extends ChronologyPageSnapshot>(pages: T[]): T[] {
  const dateFor = (page: T) =>
    page.saved_date || extractApostilaPageDate(page) || getApostilaPageSavedDate(page);

  return [...pages].sort((a, b) => {
    const aDate = dateFor(a);
    const bDate = dateFor(b);
    if (aDate && bDate && aDate !== bDate) return aDate.localeCompare(bDate);
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    return a.position - b.position || a.id.localeCompare(b.id);
  });
}

export function validateApostilaChronology(input: {
  title?: string | null;
  content?: string | null;
  pages?: ChronologyPageSnapshot[];
  saved_date?: string | null;
}): ChronologyValidationReport {
  const issues: ChronologyIssue[] = [];
  const mainTitleDates = extractChronologyDates(input.title);
  const mainContentDates = extractChronologyDates(input.content);
  const allDates = new Set([...mainTitleDates, ...mainContentDates]);
  if (input.saved_date) allDates.add(input.saved_date);

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

    const pageDate = page.saved_date || titleDates[0] || (contentDates.length === 1 ? contentDates[0] : null);
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

/**
 * Creates a page through the database contract so the next position and the
 * authenticated administrator are decided atomically by Postgres.
 */
export async function createApostilaPage(apostilaId: string, userId?: string) {
  if (!apostilaId) throw new Error('ID da apostila não informado.');
  const params = userId
    ? { _apostila_id: apostilaId, _user_id: userId }
    : { _apostila_id: apostilaId };
  const { data, error } = await (supabase.rpc as any)('create_apostila_page', params);
  if (error) throw error;
  if (!data) throw new Error('O banco não retornou a nova página.');
  return data as ApostilaPage;
}

export interface ApostilaSeparationResult {
  status: 'succeeded' | 'blocked' | 'error';
  code?: string;
  message?: string;
  apostila_id?: string;
  section_count?: number;
  detected_dates?: string[];
  created_page_ids?: string[];
  reused_page_ids?: string[];
  remaining_content_length?: number | null;
}

/** Executa a separação autorizada, versionada e idempotente no banco. */
export async function separateApostilaByDate(apostilaId: string, userId?: string | null) {
  const { data, error } = await (supabase.rpc as any)('separate_apostila_pages_by_date', {
    _apostila_id: apostilaId,
    _user_id: userId ?? null,
  });
  if (error) throw error;
  return (data || { status: 'error', code: 'empty_response' }) as ApostilaSeparationResult;
}

export interface ApostilaSplitPreviewPage {
  title: string;
  content: string;
  date?: string;
}

function buildDateSplitPreview(content: string): ApostilaSplitPreviewPage[] {
  const pages: ApostilaSplitPreviewPage[] = [];
  let current: ApostilaSplitPreviewPage | null = null;
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  for (const line of lines) {
    const date = extractChronologyDates(line)[0];
    const isAnchor = /^\s*(?:#{1,6}\s+|aula\b|encontro\b|data\b)/i.test(line);
    if (date && isAnchor) {
      if (current) current.content = current.content.trim();
      const title = line.replace(/^\s*#{1,6}\s*/, '').replace(/^\*+|\*+$/g, '').trim() || `Aula - ${date}`;
      current = { title, content: line, date };
      pages.push(current);
    } else if (current) {
      current.content += `\n${line}`;
    }
  }
  return pages.filter((page) => page.content.trim().length > 0);
}

/** Compatibilidade do Workbench: prévia local e execução pelo RPC seguro. */
export async function splitApostilaByDate(
  apostilaId: string,
  options: { dryRun?: boolean; contentOverride?: string } = {},
): Promise<{
  success: boolean;
  pages_created: number;
  dates: string[];
  preview?: ApostilaSplitPreviewPage[];
  message?: string;
}> {
  if (options.dryRun) {
    let content = options.contentOverride;
    if (content === undefined) {
      const { data, error } = await (supabase.from('apostilas' as any) as any)
        .select('content')
        .eq('id', apostilaId)
        .maybeSingle();
      if (error) throw error;
      content = data?.content || '';
    }
    const preview = buildDateSplitPreview(content || '');
    const dates = [...new Set(preview.map((page) => page.date).filter(Boolean) as string[])].sort();
    return {
      success: preview.length >= 2,
      pages_created: preview.length,
      dates,
      preview,
      message: preview.length >= 2 ? undefined : 'Não foram encontradas duas seções ancoradas por data.',
    };
  }

  const result = await separateApostilaByDate(apostilaId);
  return {
    success: result.status === 'succeeded',
    pages_created: result.section_count || 0,
    dates: result.detected_dates || [],
    message: result.message || result.code,
  };
}

