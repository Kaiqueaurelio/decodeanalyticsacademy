import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const reader = readFileSync('src/pages/ApostilaReaderPage.tsx', 'utf8');
const migration = readFileSync(
  'supabase/migrations/20260907113000_persist_apostila_page_progress.sql',
  'utf8',
);

describe('apostila page progress persistence', () => {
  it('loads and saves progress for editor-created pages', () => {
    expect(reader).toContain('from("apostila_page_progress" as any)');
    expect(reader).toContain('page_key: selectedLessonId.slice(5)');
    expect(reader).toContain('pageProgress[page.id] || null');
  });

  it('keeps page progress private to its student', () => {
    expect(migration).toContain('ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('auth.uid() = user_id');
    expect(migration).toContain('UNIQUE (user_id, apostila_id, page_key)');
  });
});
