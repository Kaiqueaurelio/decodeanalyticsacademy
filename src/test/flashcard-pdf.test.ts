import { describe, expect, it } from 'vitest';
import { createFlashcardsPdf } from '@/lib/flashcard-pdf';

describe('flashcard PDF export', () => {
  it('creates one formatted PDF page per flashcard', () => {
    const doc = createFlashcardsPdf([
      { question: 'O que é um algoritmo?', answer: 'Uma sequência finita de passos para resolver um problema.' },
      { question: 'O que é uma máquina de estados?', answer: 'Um modelo que muda de estado conforme as entradas recebidas.' },
    ]);

    expect(doc.getNumberOfPages()).toBe(2);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(5_000);
  });

  it('fits long content without creating extra or clipped pages', () => {
    const longAnswer = Array.from({ length: 80 }, (_, index) => `Conceito ${index + 1}`).join(' - ');
    const doc = createFlashcardsPdf([
      { question: 'Resuma os conceitos principais.', answer: longAnswer },
    ]);

    expect(doc.getNumberOfPages()).toBe(1);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(4_000);
  });
});
