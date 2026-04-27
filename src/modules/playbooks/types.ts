// PlayBooks module — data models (Google Play Books-like)
export type PBFormat = 'pdf' | 'epub';
export type HighlightColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple';

export interface PBBook {
  id: string;
  title: string;
  author: string | null;
  cover: string | null;
  format: PBFormat;
  fileUrl: string;
  pageCount: number | null;
  language?: string;
  description?: string | null;
}

export interface PBLibraryItem {
  bookId: string;
  progress: number; // 0..100
  currentLocation: string | null;
  currentPage: number | null;
  lastOpened: string | null;
  isDownloaded: boolean;
  isFavorite: boolean;
}

export interface PBHighlight {
  id: string;
  user_id: string;
  book_id: string;
  text: string;
  color: HighlightColor;
  start_location: string | null;
  end_location: string | null;
  page: number | null;
  created_at: string;
}

export interface PBNote {
  id: string;
  user_id: string;
  book_id: string;
  highlight_id: string | null;
  content: string;
  page: number | null;
  created_at: string;
  updated_at: string;
}

export interface PBBookmark {
  id: string;
  user_id: string;
  book_id: string;
  location: string | null;
  page: number | null;
  label: string | null;
  created_at: string;
}

export interface PBReadingProgress {
  book_id: string;
  percentage: number;
  position: string | null;
  page: number | null;
  updatedAt: string;
}

export const HIGHLIGHT_COLORS: Record<HighlightColor, string> = {
  yellow: '#fde68a',
  blue: '#bfdbfe',
  green: '#bbf7d0',
  pink: '#fbcfe8',
  purple: '#ddd6fe',
};

export function detectPBFormat(url: string): PBFormat {
  const lower = (url || '').toLowerCase().split('?')[0];
  return lower.endsWith('.epub') ? 'epub' : 'pdf';
}
