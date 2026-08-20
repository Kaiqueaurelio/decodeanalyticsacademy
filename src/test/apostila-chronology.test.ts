import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import {
  createApostilaPage,
  extractChronologyDates,
  upsertApostilaPage,
  validateApostilaChronology,
  type ApostilaPage,
} from '@/lib/apostila-pages';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const fromMock = vi.mocked(supabase.from);

function page(overrides: Partial<ApostilaPage> = {}): ApostilaPage {
  return {
    id: 'page-default',
    apostila_id: 'book-1',
    title: 'Aula — 18/08/2026',
    content: 'Conteúdo da aula de 18/08/2026.',
    position: 0,
    created_at: '2026-08-18T08:00:00.000Z',
    updated_at: '2026-08-18T08:00:00.000Z',
    ...overrides,
  };
}

describe('invariantes de cronologia das apostilas', () => {
  it('normaliza datas válidas, remove duplicatas e ignora datas impossíveis', () => {
    expect(extractChronologyDates('18/08/2026, 18-08-2026, 31/02/2026, 19.08.2026'))
      .toEqual(['2026-08-18', '2026-08-19']);
  });

  it('marca como erro o conteúdo principal que mistura mais de uma data', () => {
    const report = validateApostilaChronology({
      title: 'Gestão de Projetos Operacionais — 18/08/2026',
      content: 'Aula de 18/08/2026. Continuação inserida por engano em 19/08/2026.',
    });

    expect(report.status).toBe('error');
    expect(report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'main_content_multiple_dates',
      'main_title_content_date_mismatch',
    ]));
  });

  it('marca como erro uma página cujo título e conteúdo pertencem a dias diferentes', () => {
    const report = validateApostilaChronology({
      pages: [page({
        id: 'page-mixed',
        title: 'Parte 2 — 19/08/2026',
        content: 'Conteúdo original de 18/08/2026.',
      })],
    });

    expect(report.status).toBe('error');
    expect(report.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'page_title_content_date_mismatch', pageId: 'page-mixed' }),
    ]));
  });

  it('impede silenciosamente a reintrodução de ordem cronológica invertida', () => {
    const report = validateApostilaChronology({
      pages: [
        page({ id: 'page-19', title: 'Aula — 19/08/2026', content: '19/08/2026', position: 0 }),
        page({ id: 'page-18', title: 'Aula — 18/08/2026', content: '18/08/2026', position: 1 }),
      ],
    });

    expect(report.status).toBe('error');
    expect(report.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'page_dates_out_of_order', pageId: 'page-18' }),
    ]));
  });

  it('aceita páginas de encontros consecutivos quando cada página tem uma única data', () => {
    const report = validateApostilaChronology({
      pages: [
        page({ id: 'page-18', title: 'Aula — 18/08/2026', content: '18/08/2026', position: 0 }),
        page({ id: 'page-19', title: 'Parte 2 — 19/08/2026', content: '19/08/2026', position: 1 }),
      ],
    });

    expect(report.status).toBe('ok');
    expect(report.issues).toHaveLength(0);
    expect(report.dates).toEqual(['2026-08-18', '2026-08-19']);
  });

  it('atualiza somente a página criada e preserva as demais páginas', () => {
    const pages = [
      page({ id: 'page-18', position: 0 }),
      page({ id: 'page-19', position: 1, title: 'Parte 2 — 19/08/2026', content: '19/08/2026' }),
    ];
    const updated = upsertApostilaPage(pages, page({
      id: 'page-19',
      position: 1,
      title: 'Parte 2 — 19/08/2026',
      content: 'Conteúdo corrigido de 19/08/2026.',
    }));

    expect(updated).toHaveLength(2);
    expect(updated.find((item) => item.id === 'page-18')?.content).toContain('18/08/2026');
    expect(updated.find((item) => item.id === 'page-19')?.content).toContain('corrigido');
  });
});

describe('criação persistente de página', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockImplementation((table: string) => {
      if (table !== 'apostila_pages') throw new Error(`tabela inesperada: ${table}`);
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: async () => ({ data: [{ position: 4 }], error: null }),
            }),
          }),
        }),
        insert: (payload: Record<string, unknown> | Record<string, unknown>[]) => {
          const row = Array.isArray(payload) ? payload[0] : payload;
          return {
            select: () => ({
              single: async () => ({
                data: {
                ...row,
                id: 'page-created',
                created_at: '2026-08-20T10:00:00.000Z',
                updated_at: '2026-08-20T10:00:00.000Z',
                },
                error: null,
              }),
            }),
          };
        },
      } as any;
    });
  });

  it('usa a próxima posição e retorna o registro criado pelo banco', async () => {
    const created = await createApostilaPage('book-1', 'admin-1');

    expect(created.id).toBe('page-created');
    expect(created.apostila_id).toBe('book-1');
    expect(created.position).toBe(5);
    expect(created.content).toBe('');
    expect(created.title).toMatch(/^Nova Página — \d{2}\/\d{2}\/\d{4}$/);
  });

  it('não transforma uma falha de leitura da posição em uma criação silenciosa', async () => {
    fromMock.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({ data: null, error: { message: 'position read failed' } }),
          }),
        }),
      }),
    } as any));

    await expect(createApostilaPage('book-1', 'admin-1')).rejects.toThrow('position read failed');
  });
});
