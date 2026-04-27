// PlayBooks — offline-first localStorage cache + sync queue
import type { PBBook, PBHighlight, PBNote, PBBookmark, PBReadingProgress } from './types';

const K = {
  books: 'pb:books:v1',
  progress: (uid: string) => `pb:progress:${uid}`,
  highlights: (uid: string) => `pb:hl:${uid}`,
  notes: (uid: string) => `pb:notes:${uid}`,
  bookmarks: (uid: string) => `pb:bm:${uid}`,
  recent: (uid: string) => `pb:recent:${uid}`,
  favorites: (uid: string) => `pb:fav:${uid}`,
  downloaded: (uid: string) => `pb:dl:${uid}`,
  syncQueue: 'pb:sync-queue:v1',
  prefs: 'pb:reader-prefs:v1',
};

function read<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; }
  catch { return fallback; }
}
function write<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

export const pbCache = {
  getBooks: () => read<PBBook[]>(K.books, []),
  setBooks: (b: PBBook[]) => write(K.books, b),

  getProgress: (uid: string) => read<Record<string, PBReadingProgress>>(K.progress(uid), {}),
  setProgress: (uid: string, m: Record<string, PBReadingProgress>) => write(K.progress(uid), m),

  getHighlights: (uid: string) => read<PBHighlight[]>(K.highlights(uid), []),
  setHighlights: (uid: string, h: PBHighlight[]) => write(K.highlights(uid), h),

  getNotes: (uid: string) => read<PBNote[]>(K.notes(uid), []),
  setNotes: (uid: string, n: PBNote[]) => write(K.notes(uid), n),

  getBookmarks: (uid: string) => read<PBBookmark[]>(K.bookmarks(uid), []),
  setBookmarks: (uid: string, b: PBBookmark[]) => write(K.bookmarks(uid), b),

  getRecent: (uid: string) => read<string[]>(K.recent(uid), []),
  pushRecent: (uid: string, bookId: string) => {
    const cur = read<string[]>(K.recent(uid), []).filter((x) => x !== bookId);
    cur.unshift(bookId);
    write(K.recent(uid), cur.slice(0, 20));
  },

  getFavorites: (uid: string) => read<string[]>(K.favorites(uid), []),
  toggleFavorite: (uid: string, bookId: string): boolean => {
    const cur = new Set(read<string[]>(K.favorites(uid), []));
    const fav = cur.has(bookId) ? (cur.delete(bookId), false) : (cur.add(bookId), true);
    write(K.favorites(uid), [...cur]);
    return fav;
  },

  getDownloaded: (uid: string) => read<string[]>(K.downloaded(uid), []),
  markDownloaded: (uid: string, bookId: string) => {
    const cur = new Set(read<string[]>(K.downloaded(uid), []));
    cur.add(bookId);
    write(K.downloaded(uid), [...cur]);
  },
  unmarkDownloaded: (uid: string, bookId: string) => {
    const cur = new Set(read<string[]>(K.downloaded(uid), []));
    cur.delete(bookId);
    write(K.downloaded(uid), [...cur]);
  },

  getPrefs: () => read<Record<string, unknown>>(K.prefs, {}),
  setPrefs: (p: Record<string, unknown>) => write(K.prefs, p),
};

// ── Simple sync queue (operations to retry when online) ─────────────────────
export type SyncOp = {
  id: string;
  kind: 'progress' | 'highlight-add' | 'highlight-del' | 'note-add' | 'note-del' | 'bookmark-add' | 'bookmark-del';
  payload: any;
  ts: number;
};
export const syncQueue = {
  list: (): SyncOp[] => read<SyncOp[]>(K.syncQueue, []),
  push: (op: Omit<SyncOp, 'id' | 'ts'>) => {
    const cur = read<SyncOp[]>(K.syncQueue, []);
    cur.push({ ...op, id: crypto.randomUUID(), ts: Date.now() });
    write(K.syncQueue, cur);
  },
  remove: (id: string) => {
    const cur = read<SyncOp[]>(K.syncQueue, []).filter((o) => o.id !== id);
    write(K.syncQueue, cur);
  },
  clear: () => write(K.syncQueue, []),
};
