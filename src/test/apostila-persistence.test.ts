import { describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

describe('revision-safe apostila persistence', () => {
  it('calls the main apostila persistence RPC with the expected revision', async () => {
    rpcMock.mockResolvedValueOnce({ data: { id: 'book-1', content_revision: 8 }, error: null });
    const { saveApostilaWithRevision } = await import('@/lib/apostila-persistence');

    await saveApostilaWithRevision({
      apostilaId: 'book-1',
      expectedRevision: 7,
      title: 'Título',
      category: 'Disciplina',
      content: 'Conteúdo',
      published: true,
      semester: 3,
      course: ['CC'],
      savedDate: '2026-09-10',
    });

    expect(rpcMock).toHaveBeenCalledWith('save_apostila', {
      _apostila_id: 'book-1',
      _expected_revision: 7,
      _title: 'Título',
      _category: 'Disciplina',
      _content: 'Conteúdo',
      _published: true,
      _semester: 3,
      _course: ['CC'],
      _saved_date: '2026-09-10',
    });
  });

  it('calls the page persistence RPC with the expected revision', async () => {
    rpcMock.mockResolvedValueOnce({ data: { id: 'page-1', content_revision: 4 }, error: null });
    const { saveApostilaPageWithRevision } = await import('@/lib/apostila-persistence');

    await saveApostilaPageWithRevision({
      pageId: 'page-1',
      apostilaId: 'book-1',
      expectedRevision: 3,
      title: 'Aula 1',
      content: 'Conteúdo da aula',
      savedDate: '2026-09-10',
    });

    expect(rpcMock).toHaveBeenCalledWith('save_apostila_page', {
      _page_id: 'page-1',
      _apostila_id: 'book-1',
      _expected_revision: 3,
      _title: 'Aula 1',
      _content: 'Conteúdo da aula',
      _saved_date: '2026-09-10',
    });
  });
});
