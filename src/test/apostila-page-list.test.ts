import {
  formatApostilaDate,
  getApostilaPageSavedDate,
  isMissingApostilaPageSavedDateColumn,
  resolveApostilaDateFilter,
  upsertApostilaPage,
  type ApostilaPage,
} from '../lib/apostila-pages';

const page = (id: string, position: number, title: string): ApostilaPage => ({
  id,
  apostila_id: 'apostila-1',
  title,
  content: `${title} content`,
  position,
  created_at: `2026-08-19T00:0${position}:00.000Z`,
  updated_at: `2026-08-19T00:0${position}:00.000Z`,
});

describe('upsertApostilaPage', () => {
  it('adds a saved page that was not present in the current list and preserves order', () => {
    const result = upsertApostilaPage([page('page-2', 2, 'Página 2')], page('page-1', 1, 'Página 1'));
    expect(result.map((item) => item.id)).toEqual(['page-1', 'page-2']);
  });

  it('updates the existing page without duplicating it', () => {
    const result = upsertApostilaPage([page('page-1', 1, 'Antigo')], page('page-1', 1, 'Atualizado'));
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Atualizado');
  });
});

describe('apostila page dates', () => {
  it('mostra todas as datas por padrão e só filtra quando a URL solicita', () => {
    expect(resolveApostilaDateFilter(null)).toBe('all');
    expect(resolveApostilaDateFilter('')).toBe('all');
    expect(resolveApostilaDateFilter('31/08/2026')).toBe('all');
    expect(resolveApostilaDateFilter('2026-08-31')).toBe('2026-08-31');
  });

  it('prefers the explicit saved_date over timestamps', () => {
    expect(getApostilaPageSavedDate({
      saved_date: '2026-08-20',
      updated_at: '2026-08-21T23:59:00.000Z',
    })).toBe('2026-08-20');
  });

  it('falls back to updated_at when the saved_date column is unavailable', () => {
    expect(getApostilaPageSavedDate({ updated_at: '2026-08-19T12:00:00.000Z' })).toMatch(/^2026-08-19$/);
  });

  it('formats dates for student and admin lists', () => {
    expect(formatApostilaDate('2026-08-21')).toBe('21/08/2026');
    expect(formatApostilaDate(null)).toBe('Data pendente');
  });

  it('recognizes schema errors that require the timestamp fallback', () => {
    expect(isMissingApostilaPageSavedDateColumn({ code: '42703', message: 'column saved_date does not exist' })).toBe(true);
    expect(isMissingApostilaPageSavedDateColumn({ code: '23505', message: 'duplicate key' })).toBe(false);
  });
});
