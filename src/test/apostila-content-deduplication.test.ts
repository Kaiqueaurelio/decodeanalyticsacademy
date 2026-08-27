import { isSubstantialDuplicateContent } from '@/lib/content-formatting';

describe('desduplicação segura do conteúdo das apostilas', () => {
  it('remove cópias exatas mesmo com pequenas diferenças de markdown', () => {
    expect(isSubstantialDuplicateContent('# Introdução\n\nTexto completo', 'Introdução Texto completo')).toBe(true);
  });

  it('remove versões quase idênticas', () => {
    const full = `${'conteúdo principal '.repeat(100)}apêndice curto`;
    const almostSame = 'conteúdo principal '.repeat(100);
    expect(isSubstantialDuplicateContent(full, almostSame)).toBe(true);
  });

  it('não confunde um resumo curto com a apostila completa', () => {
    const summary = 'Bem-vindo à Teoria da Computação. Este material cobre os fundamentos.';
    const full = `${summary}\n\n${'Explicação detalhada das máquinas de estado e linguagens formais. '.repeat(100)}`;
    expect(isSubstantialDuplicateContent(summary, full)).toBe(false);
  });
});
