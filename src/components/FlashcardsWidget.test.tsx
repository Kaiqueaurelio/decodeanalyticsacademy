import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlashcardsWidget } from './FlashcardsWidget';

const navigate = vi.fn();
const update = vi.fn();
const eq = vi.fn();
const from = vi.fn();

const cards = [
  {
    id: 'card-1',
    front: 'Pergunta original',
    back: 'Resposta original',
    difficulty: 1,
    next_review: null,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
  },
  {
    id: 'card-2',
    front: 'Segunda pergunta',
    back: 'Segunda resposta',
    difficulty: 1,
    next_review: null,
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
  },
];

function createFetchBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    then: (resolve: (value: unknown) => void) => resolve({ data: cards, error: null }),
  };
  return builder;
}

function createUpdateBuilder() {
  const builder = {
    update: vi.fn((payload: unknown) => {
      update(payload);
      return builder;
    }),
    eq: vi.fn((column: string, value: string) => {
      eq(column, value);
      return builder;
    }),
    select: vi.fn(() => builder),
    single: vi.fn(async () => ({ data: { id: 'card-1' }, error: null })),
  };
  return builder;
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'student-1' } }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
  },
}));

describe('FlashcardsWidget', () => {
  beforeEach(() => {
    navigate.mockClear();
    update.mockClear();
    eq.mockClear();
    from.mockReset();
    let callCount = 0;
    from.mockImplementation(() => {
      callCount += 1;
      return callCount === 1 ? createFetchBuilder() : createUpdateBuilder();
    });
  });

  it('permite navegar para o próximo flashcard sem precisar avaliá-lo', async () => {
    const user = userEvent.setup();
    render(<FlashcardsWidget apostilaId="apostila-1" />);

    expect(await screen.findByText('Pergunta original')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Próximo flashcard' }));
    expect(screen.getByText('Segunda pergunta')).toBeInTheDocument();
  });

  it('permite ao aluno editar pergunta e resposta e mantém a alteração na tela', async () => {
    const user = userEvent.setup();
    render(<FlashcardsWidget apostilaId="apostila-1" />);

    expect(await screen.findByText('Pergunta original')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Editar este cartão' }));
    await user.clear(screen.getByRole('textbox', { name: 'Pergunta do flashcard' }));
    await user.type(screen.getByRole('textbox', { name: 'Pergunta do flashcard' }), 'Pergunta corrigida');
    await user.clear(screen.getByRole('textbox', { name: 'Resposta do flashcard' }));
    await user.type(screen.getByRole('textbox', { name: 'Resposta do flashcard' }), 'Resposta corrigida');
    await user.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(screen.getByText('Pergunta corrigida')).toBeInTheDocument());
    expect(update).toHaveBeenCalledWith({ front: 'Pergunta corrigida', back: 'Resposta corrigida' });
    expect(eq).toHaveBeenCalledWith('id', 'card-1');
    expect(eq).toHaveBeenCalledWith('user_id', 'student-1');
  });
});
