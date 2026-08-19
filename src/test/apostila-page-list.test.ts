import { describe, expect, it } from 'vitest';
import { upsertApostilaPage, type ApostilaPage } from '../lib/apostila-pages';

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
