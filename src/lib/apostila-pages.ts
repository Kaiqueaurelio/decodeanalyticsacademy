import { supabase } from '@/integrations/supabase/client';

export interface ApostilaPage {
  id: string;
  apostila_id: string;
  title: string;
  content: string;
  position: number;
  created_at: string;
  updated_at: string;
  saved_date?: string | null;
}

export function getLocalDateIso(value = new Date()): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getApostilaPageSavedDate(input: { saved_date?: string | null; updated_at?: string | null; created_at?: string | null }): string | null {
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

export interface ChronologyPageSnapshot { id: string; title: string; content?: string | null; position: number; saved_date?: string | null; created_at?: string | null; updated_at?: string | null; }
export type ChronologyIssueSeverity = 'warning' | 'error';
export interface ChronologyIssue { code: string; severity: ChronologyIssueSeverity; message: string; pageId?: string; metadata: Record<string, unknown>; }
export interface ChronologyValidationReport { status: 'ok' | 'warning' | 'error'; issues: ChronologyIssue[]; dates: string[]; }

const DATE_PATTERN = /\b([0-3]\d)[/.-]([01]\d)[/.-]((?:19|20)\d{2})\b/g;
function toIsoDate(day: string, month: string, year: string): string | null {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day)) return null;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
export function extractChronologyDates(text: string | null | undefined): string[] {
  const dates = new Set<string>();
  for (const match of (text || '').matchAll(DATE_PATTERN)) {
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
export function formatApostilaDate(isoDate: string | null | undefined): string { if (!isoDate) return 'Data pendente'; const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate); return match ? `${match[3]}/${match[2]}/${match[1]}` : isoDate; }
function getChronologySortDate(page: ChronologyPageSnapshot): string | null { if (page.saved_date && /^\d{4}-\d{2}-\d{2}$/.test(page.saved_date)) return page.saved_date; const editorialDate = extractApostilaPageDate(page); if (editorialDate) return editorialDate; return getApostilaPageSavedDate(page); }
export function sortApostilaPagesChronologically<T extends ChronologyPageSnapshot>(pages: T[]): T[] { return [...pages].sort((a, b) => { const ad = getChronologySortDate(a), bd = getChronologySortDate(b); if (ad && bd && ad !== bd) return ad.localeCompare(bd); if (ad && !bd) return -1; if (!ad && bd) return 1; return a.position - b.position || a.id.localeCompare(b.id); }); }
export function resolveApostilaDateFilter(requestedDate: string | null | undefined): string { return requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : 'all'; }
export function validateApostilaChronology(input: { title?: string | null; content?: string | null; pages?: ChronologyPageSnapshot[]; saved_date?: string | null }): ChronologyValidationReport {
  const issues: ChronologyIssue[] = [];
  const titleDates = extractChronologyDates(input.title), mainDates = extractChronologyDates(input.content);
  const allDates = new Set([...titleDates, ...mainDates]); if (input.saved_date) allDates.add(input.saved_date);
  if (mainDates.length > 1) issues.push({ code: 'main_content_multiple_dates', severity: 'error', message: 'O conteúdo principal contém mais de uma data de aula.', metadata: { detectedDates: mainDates } });
  if (titleDates.length === 1 && mainDates.some((date) => date !== titleDates[0])) issues.push({ code: 'main_title_content_date_mismatch', severity: 'error', message: 'A data do título não corresponde às datas do conteúdo principal.', metadata: { titleDate: titleDates[0], contentDates: mainDates } });
  let previousDate: string | null = null;
  for (const page of sortApostilaPagesChronologically(input.pages || [])) {
    const pageTitleDates = extractChronologyDates(page.title), pageContentDates = extractChronologyDates(page.content);
    if (pageTitleDates.length === 0 && pageContentDates.length > 0) issues.push({ code: 'page_title_missing_date', severity: 'warning', message: 'A página contém data no conteúdo, mas não no título.', pageId: page.id, metadata: { contentDates: pageContentDates, title: page.title, position: page.position } });
    if (pageContentDates.length > 1) issues.push({ code: 'page_content_multiple_dates', severity: 'error', message: 'Uma única página contém múltiplas datas de aula.', pageId: page.id, metadata: { contentDates: pageContentDates, title: page.title, position: page.position } });
    if (pageTitleDates.length === 1 && pageContentDates.some((date) => date !== pageTitleDates[0])) issues.push({ code: 'page_title_content_date_mismatch', severity: 'error', message: 'A data do título da página não corresponde ao conteúdo.', pageId: page.id, metadata: { titleDate: pageTitleDates[0], contentDates: pageContentDates, title: page.title, position: page.position } });
    const pageDate = page.saved_date || pageTitleDates[0] || (pageContentDates.length === 1 ? pageContentDates[0] : null);
    if (pageDate && previousDate && pageDate < previousDate) issues.push({ code: 'page_dates_out_of_order', severity: 'error', message: 'As páginas estão fora da ordem cronológica.', pageId: page.id, metadata: { previousDate, currentDate: pageDate, title: page.title, position: page.position } });
    if (pageDate) previousDate = pageDate;
    pageContentDates.forEach((date) => allDates.add(date)); pageTitleDates.forEach((date) => allDates.add(date));
  }
  return { status: issues.some((i) => i.severity === 'error') ? 'error' : issues.length ? 'warning' : 'ok', issues, dates: [...allDates].sort() };
}
export function upsertApostilaPage(pages: ApostilaPage[], savedPage: ApostilaPage) { const exists = pages.some((p) => p.id === savedPage.id); return sortApostilaPagesChronologically(exists ? pages.map((p) => p.id === savedPage.id ? savedPage : p) : [...pages, savedPage]); }

/** Criação atômica no banco; usa o contrato que valida o usuário da sessão quando disponível. */
export async function createApostilaPage(apostilaId: string, userId?: string) {
  if (!apostilaId) throw new Error('ID da apostila não informado.');
  const params = userId ? { _apostila_id: apostilaId, _user_id: userId } : { _apostila_id: apostilaId };
  const { data, error } = await (supabase.rpc as any)('create_apostila_page', params);
  if (error) throw error;
  if (!data) throw new Error('O banco não retornou a nova página.');
  return data as ApostilaPage;
}

/** Read-after-write: confirma que o conteúdo recém salvo está visível pela sessão atual. */
export async function verifyApostilaPersistence(apostilaId: string) {
  if (!apostilaId) throw new Error('ID da apostila não informado.');
  const [{ data: apostila, error: apostilaError }, { data: pages, error: pagesError }] = await Promise.all([
    supabase.from('apostilas').select('id, content').eq('id', apostilaId).maybeSingle(),
    supabase.from('apostila_pages').select('id, content').eq('apostila_id', apostilaId),
  ]);
  if (apostilaError) throw apostilaError;
  if (pagesError) throw pagesError;
  if (!apostila) throw new Error('Apostila não encontrada após o salvamento.');
  const pageRows = pages || [];
  const nonEmptyPages = pageRows.filter((p) => typeof p.content === 'string' && p.content.trim().length > 0).length;
  const contentChars = typeof apostila.content === 'string' ? apostila.content.trim().length : 0;
  return { ok: contentChars > 0 || nonEmptyPages > 0 || pageRows.length > 0, apostilaId, pages: pageRows.length, nonEmptyPages, contentChars };
}

export interface ApostilaSeparationResult { status: 'succeeded' | 'blocked' | 'error'; code?: string; message?: string; apostila_id?: string; section_count?: number; detected_dates?: string[]; created_page_ids?: string[]; reused_page_ids?: string[]; remaining_content_length?: number | null; }
export async function separateApostilaByDate(apostilaId: string, userId?: string | null) { const { data, error } = await (supabase.rpc as any)('separate_apostila_pages_by_date', { _apostila_id: apostilaId, _user_id: userId ?? null }); if (error) throw error; return (data || { status: 'error', code: 'empty_response' }) as ApostilaSeparationResult; }
export interface ApostilaSplitPreviewPage { title: string; content: string; date?: string; }
function buildDateSplitPreview(content: string): ApostilaSplitPreviewPage[] { const pages: ApostilaSplitPreviewPage[] = []; let current: ApostilaSplitPreviewPage | null = null; for (const line of content.replace(/\r\n?/g, '\n').split('\n')) { const date = extractChronologyDates(line)[0]; const isAnchor = /^\s*(?:#{1,6}\s+|aula\b|encontro\b|data\b)/i.test(line); if (date && isAnchor) { if (current) current.content = current.content.trim(); const title = line.replace(/^\s*#{1,6}\s*/, '').replace(/^\*+|\*+$/g, '').trim() || `Aula - ${date}`; current = { title, content: line, date }; pages.push(current); } else if (current) current.content += `\n${line}`; } return pages.filter((p) => p.content.trim().length > 0); }
export async function splitApostilaByDate(apostilaId: string, options: { dryRun?: boolean; contentOverride?: string } = {}) { if (options.dryRun) { const pages = buildDateSplitPreview(options.contentOverride || ''); return { success: pages.length > 0, pages_created: 0, dates: pages.map((p) => p.date).filter(Boolean) as string[], preview: pages }; } const result = await separateApostilaByDate(apostilaId); return { success: result.status === 'succeeded', pages_created: result.created_page_ids?.length || 0, dates: result.detected_dates || [], preview: [] }; }
export function extractApostilaDatesFromContent(content: string): string[] { return extractChronologyDates(content); }
export function getChronologyValidationSummary(input: Parameters<typeof validateApostilaChronology>[0]) { return validateApostilaChronology(input); }
export async function runApostilaChronologyValidation(apostilaId: string, mode: string = 'save') {
  if (!apostilaId) throw new Error('ID da apostila não informado.');
  const { data, error } = await (supabase.rpc as any)('run_apostila_chronology_validation', {
    _apostila_id: apostilaId,
    _trigger_source: mode,
  });
  if (error) throw error;
  return data;
}
