import { describe, expect, it, vi } from 'vitest';

const { rpcMock, fromMock, maybeSingleMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
  maybeSingleMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
  },
}));

describe('revision-safe apostila persistence', () => {
  const pageDraft = { pageId: 'p1', apostilaId: 'a1', expectedRevision: 2, title: 'Aula', content: 'Texto completo', savedDate: '2026-09-10' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('preserva conflitos de revisão sem repetir a gravação', async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { code: '40001' } });
    const { saveApostilaPageWithRevision } = await import('@/lib/apostila-persistence');
    expect((await saveApostilaPageWithRevision(pageDraft)).error).toEqual({ code: '40001' });
  });

  it('confirma o conteúdo salvo após timeout, sem sobrescrever uma revisão nova', async () => {
    const query: any = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: maybeSingleMock,
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    fromMock.mockReturnValue(query);
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'upstream request timeout' } });
    maybeSingleMock.mockResolvedValueOnce({
      data: { id: 'p1', apostila_id: 'a1', title: 'Aula', content: 'Texto completo' },
      error: null,
    });

    const { saveApostilaPageWithRevision } = await import('@/lib/apostila-persistence');
    const result = await saveApostilaPageWithRevision(pageDraft);

    expect(result.error).toBeNull();
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it('aguarda a confirmação de leitura quando a resposta do gateway chega antes da transação', async () => {
    vi.useFakeTimers();
    const query: any = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: maybeSingleMock,
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    fromMock.mockReturnValue(query);
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: 'upstream request timeout' } });
    maybeSingleMock
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: { id: 'p1', apostila_id: 'a1', title: 'Aula', content: 'Texto completo' },
        error: null,
      });

    const { saveApostilaPageWithRevision } = await import('@/lib/apostila-persistence');
    const resultPromise = saveApostilaPageWithRevision(pageDraft);
    await vi.advanceTimersByTimeAsync(250);
    const result = await resultPromise;

    expect(result.error).toBeNull();
    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(maybeSingleMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
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
