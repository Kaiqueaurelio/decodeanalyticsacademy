import { isSubstantialDuplicateContent, mergeDistinctPages } from '@/lib/content-formatting';

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

  it('reconhece uma apostila longa incorporada em uma página maior', () => {
    const original = Array.from({ length: 180 }, (_, index) => `conceito ${index} explicado com um exemplo acadêmico`).join('\n');
    const expanded = `# Aula completa\n\n${original}\n\n## Exercícios\n\n${'questão adicional resolvida '.repeat(120)}`;
    expect(isSubstantialDuplicateContent(original, expanded)).toBe(true);
  });

  it('mantém apenas a versão mais completa de páginas duplicadas', () => {
    const original = 'fundamento importante com explicação detalhada '.repeat(80);
    const expanded = `${original}\n\n${'exercício complementar '.repeat(80)}`;
    const pages = mergeDistinctPages([
      { id: 'curta', content: original },
      { id: 'completa', content: expanded },
    ]);
    expect(pages).toEqual([{ id: 'completa', content: expanded }]);
  });
});
