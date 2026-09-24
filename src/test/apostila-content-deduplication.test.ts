import { isPlaceholderPageContent, isSubstantialDuplicateContent, mergeDistinctPages } from '@/lib/content-formatting';

describe('páginas provisórias', () => {
  it.each(['Conteúdo em processamento.', '**Material em fase de estruturação**', 'Este conteúdo está sendo estruturado'])('reconhece o aviso isolado: %s', (content) => {
    expect(isPlaceholderPageContent(content)).toBe(true);
  });

  it('preserva conteúdo real junto de um aviso antigo', () => {
    expect(isPlaceholderPageContent('Conteúdo em processamento.\n\n## Aula\nUma variável armazena um valor que pode mudar durante a execução.')).toBe(false);
  });
});

describe('desduplicação segura do conteúdo das apostilas', () => {
  it('remove cópias exatas mesmo com pequenas diferenças de markdown', () => {
    expect(isSubstantialDuplicateContent('# Introdução\n\nTexto completo', 'Introdução Texto completo')).toBe(true);
  });

  it('remove uma versão menor quando ela está inteira dentro da versão maior', () => {
    const full = `${'conteúdo principal '.repeat(100)}apêndice curto`;
    const smaller = 'conteúdo principal '.repeat(100);
    expect(isSubstantialDuplicateContent(full, smaller)).toBe(true);
  });

  it('não confunde textos semelhantes, mas não contidos, com duplicatas', () => {
    const summary = 'Bem-vindo à Teoria da Computação. Este material cobre os fundamentos.';
    const full = `Fundamentos de Teoria da Computação: linguagens, autômatos e máquinas de Turing. ${'Explicação detalhada das máquinas de estado e linguagens formais. '.repeat(100)}`;
    expect(isSubstantialDuplicateContent(summary, full)).toBe(false);
  });

  it('reconhece uma apostila longa incorporada em uma página maior', () => {
    const original = Array.from({ length: 180 }, (_, index) => `conceito ${index} explicado com um exemplo acadêmico`).join('\n');
    const expanded = `# Aula completa\n\n${original}\n\n## Exercícios\n\n${'questão adicional resolvida '.repeat(120)}`;
    expect(isSubstantialDuplicateContent(original, expanded)).toBe(true);
  });

  it('mantém apenas a versão mais completa quando uma página está inteira contida na outra', () => {
    const original = 'fundamento importante com explicação detalhada '.repeat(80);
    const expanded = `${original}\n\n${'exercício complementar '.repeat(80)}`;
    const pages = mergeDistinctPages([
      { id: 'curta', content: original },
      { id: 'completa', content: expanded },
    ]);
    expect(pages).toEqual([{ id: 'completa', content: expanded }]);
  });

  it('preserva duas páginas quando ambas têm conteúdo único', () => {
    const first = 'conceitos fundamentais e introdução ao assunto';
    const second = 'conceitos fundamentais e aplicações práticas avançadas';
    const pages = mergeDistinctPages([
      { id: 'primeira', content: first },
      { id: 'segunda', content: second },
    ]);
    expect(pages).toHaveLength(2);
    expect(pages.map((page) => page.id)).toEqual(['primeira', 'segunda']);
  });
});
