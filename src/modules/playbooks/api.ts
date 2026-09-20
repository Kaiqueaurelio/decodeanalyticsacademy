// PlayBooks — Supabase data access layer (reuses existing 'books' + 'reading_progress' tables)
import { supabase } from '@/integrations/supabase/client';
import type { PBBook, PBHighlight, PBNote, PBBookmark, HighlightColor, PBFormat } from './types';
import { pbCache, syncQueue } from './storage';

export async function fetchBooks(): Promise<PBBook[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const books: PBBook[] = (data || []).map((b: any) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    cover: b.cover_url,
    format: (b.file_type as PBFormat) || 'pdf',
    fileUrl: b.file_url,
    pageCount: b.total_pages,
    description: b.description,
  }));
  pbCache.setBooks(books);
  return books;
}

export async function fetchBook(id: string): Promise<PBBook | null> {
  const { data } = await supabase.from('books').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    author: data.author,
    cover: data.cover_url,
    format: (data.file_type as PBFormat) || 'pdf',
    fileUrl: data.file_url,
    pageCount: data.total_pages,
    description: data.description,
  };
}

export function getBookStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const publicMarker = '/storage/v1/object/public/books/';
    const signedMarker = '/storage/v1/object/sign/books/';
    const marker = parsed.pathname.includes(publicMarker) ? publicMarker
      : parsed.pathname.includes(signedMarker) ? signedMarker
      : null;
    if (!marker) return null;
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) return null;
    return decodeURIComponent(parsed.pathname.slice(index + marker.length)).replace(/^\/+/, '');
  } catch {
    return null;
  }
}

export async function createBookSignedUrl(fileUrl: string): Promise<string> {
  if (!fileUrl || fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) return fileUrl;
  const path = getBookStoragePath(fileUrl);
  if (!path) return fileUrl;

  const { data, error } = await supabase.storage.from('books').createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) {
    throw new Error('Não foi possível liberar o acesso ao livro.');
  }
  return data.signedUrl;
}

export async function signBookCovers(books: PBBook[]): Promise<PBBook[]> {
  const entries = books
    .map((book) => ({ book, path: getBookStoragePath(book.cover) }))
    .filter((entry): entry is { book: PBBook; path: string } => Boolean(entry.path));

  if (entries.length === 0) return books;

  const { data } = await supabase.storage
    .from('books')
    .createSignedUrls(entries.map((entry) => entry.path), 3600);

  const signedByPath = new Map(
    (data ?? [])
      .filter((item): item is { path: string; signedUrl: string } => Boolean(item?.path && item?.signedUrl))
      .map((item) => [item.path, item.signedUrl]),
  );

  return books.map((book) => {
    const path = getBookStoragePath(book.cover);
    const signed = path ? signedByPath.get(path) : null;
    return signed ? { ...book, cover: signed } : book;
  });
}

// ── Reading progress ────────────────────────────────────────────────────────
export async function fetchAllProgress(userId: string) {
  const { data } = await supabase.from('reading_progress').select('*').eq('user_id', userId);
  const map: Record<string, { percentage: number; page: number | null; location: string | null; updatedAt: string }> = {};
  (data || []).forEach((r: any) => {
    map[r.book_id] = {
      percentage: Number(r.progress_percentage || 0),
      page: r.current_page,
      location: r.location,
      updatedAt: r.updated_at,
    };
  });
  return map;
}

export async function saveProgress(userId: string, bookId: string, fileType: PBFormat, patch: { current_page?: number; location?: string; progress_percentage?: number }) {
  try {
    await supabase.from('reading_progress').upsert(
      { user_id: userId, book_id: bookId, file_type: fileType, ...patch },
      { onConflict: 'user_id,book_id' },
    );
  } catch {
    syncQueue.push({ kind: 'progress', payload: { userId, bookId, fileType, patch } });
  }
}

// ── Highlights ──────────────────────────────────────────────────────────────
export async function fetchHighlights(userId: string, bookId?: string): Promise<PBHighlight[]> {
  let q = supabase.from('playbooks_highlights' as any).select('*').eq('user_id', userId);
  if (bookId) q = q.eq('book_id', bookId);
  const { data } = await q.order('created_at', { ascending: false });
  return (data || []) as unknown as PBHighlight[];
}

export async function addHighlight(h: Omit<PBHighlight, 'id' | 'created_at'>): Promise<PBHighlight | null> {
  const { data, error } = await supabase
    .from('playbooks_highlights' as any)
    .insert(h as any)
    .select()
    .maybeSingle();
  if (error) {
    syncQueue.push({ kind: 'highlight-add', payload: h });
    return null;
  }
  return data as unknown as PBHighlight;
}

export async function deleteHighlight(id: string) {
  await supabase.from('playbooks_highlights' as any).delete().eq('id', id);
}

// ── Notes ───────────────────────────────────────────────────────────────────
export async function fetchNotes(userId: string, bookId?: string): Promise<PBNote[]> {
  let q = supabase.from('playbooks_notes' as any).select('*').eq('user_id', userId);
  if (bookId) q = q.eq('book_id', bookId);
  const { data } = await q.order('created_at', { ascending: false });
  return (data || []) as unknown as PBNote[];
}

export async function addNote(n: Omit<PBNote, 'id' | 'created_at' | 'updated_at'>): Promise<PBNote | null> {
  const { data, error } = await supabase.from('playbooks_notes' as any).insert(n as any).select().maybeSingle();
  if (error) { syncQueue.push({ kind: 'note-add', payload: n }); return null; }
  return data as unknown as PBNote;
}

export async function deleteNote(id: string) {
  await supabase.from('playbooks_notes' as any).delete().eq('id', id);
}

// ── Bookmarks ───────────────────────────────────────────────────────────────
export async function fetchBookmarks(userId: string, bookId?: string): Promise<PBBookmark[]> {
  let q = supabase.from('playbooks_bookmarks' as any).select('*').eq('user_id', userId);
  if (bookId) q = q.eq('book_id', bookId);
  const { data } = await q.order('created_at', { ascending: false });
  return (data || []) as unknown as PBBookmark[];
}

export async function addBookmark(b: Omit<PBBookmark, 'id' | 'created_at'>): Promise<PBBookmark | null> {
  const { data, error } = await supabase.from('playbooks_bookmarks' as any).insert(b as any).select().maybeSingle();
  if (error) { syncQueue.push({ kind: 'bookmark-add', payload: b }); return null; }
  return data as unknown as PBBookmark;
}

export async function deleteBookmark(id: string) {
  await supabase.from('playbooks_bookmarks' as any).delete().eq('id', id);
}

// ── Sync queue flush ────────────────────────────────────────────────────────
export async function flushSyncQueue() {
  const ops = syncQueue.list();
  for (const op of ops) {
    try {
      if (op.kind === 'progress') {
        const { userId, bookId, fileType, patch } = op.payload;
        await supabase.from('reading_progress').upsert(
          { user_id: userId, book_id: bookId, file_type: fileType, ...patch },
          { onConflict: 'user_id,book_id' },
        );
      } else if (op.kind === 'highlight-add') {
        await supabase.from('playbooks_highlights' as any).insert(op.payload);
      } else if (op.kind === 'note-add') {
        await supabase.from('playbooks_notes' as any).insert(op.payload);
      } else if (op.kind === 'bookmark-add') {
        await supabase.from('playbooks_bookmarks' as any).insert(op.payload);
      }
      syncQueue.remove(op.id);
    } catch { /* keep in queue, retry later */ }
  }
}

export const HighlightColorsList: HighlightColor[] = ['yellow', 'blue', 'green', 'pink', 'purple'];
