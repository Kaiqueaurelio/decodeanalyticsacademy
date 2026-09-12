import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: rpcMock,
  },
}));

describe('revision-safe apostila persistence', () => {
  const pageDraft = { pageId: 'p1', apostilaId: 'a1', expectedRevision: 2, title: 'Aula', content: 'Texto completo', savedDate: '2026-09-10' };

  it.each([null, [], [{ id: 'p1' }], [{ id: 'p1', apostila_id: 'a1', title: 'Aula', content: 'Texto parcial' }]])('rejeita confirmação incompleta: %j', async (data) => {
    rpcMock.mockResolvedValueOnce({ data, error: null });
    const { saveApostilaPageWithRevision } = await import('@/lib/apostila-persistence');
    const result = await saveApostilaPageWithRevision(pageDraft);
    expect(result.error).toMatchObject({ code: 'SAVE_NOT_CONFIRMED' });
  });

  it('aceita somente a página e o texto realmente devolvidos pelo banco', async () => {
    const row = { id: 'p1', apostila_id: 'a1', title: 'Aula', content: 'Texto completo' };
    rpcMock.mockResolvedValueOnce({ data: [row], error: null });
    const { saveApostilaPageWithRevision } = await import('@/lib/apostila-persistence');
    expect((await saveApostilaPageWithRevision(pageDraft)).error).toBeNull();
  });

  it('preserva conflitos de revisão sem repetir a gravação', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/lib/apostila-persistence.ts'), 'utf8');
    expect(source).toContain("if (String(result.error?.code ?? '') === '40001') return result;");
  });

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
