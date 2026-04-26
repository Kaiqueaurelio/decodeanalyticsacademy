export interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  file_url: string;
  file_type: 'pdf' | 'epub';
  total_pages: number | null;
  published?: boolean;
  created_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  file_type: string;
  current_page: number | null;
  location: string | null;
  progress_percentage: number | null;
  updated_at: string;
}

export function detectFileType(url: string): 'pdf' | 'epub' {
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.epub')) return 'epub';
  return 'pdf';
}
