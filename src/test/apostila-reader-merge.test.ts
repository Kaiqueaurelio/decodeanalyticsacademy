import { mergePagesIntoTree, shouldRestoreRootContent } from '@/pages/ApostilaReaderPage';

const emptyTree = { apostila_id: 'apostila-1', modules: [] } as any;

const lessonsOf = (tree: any) =>
  tree.modules.flatMap((m: any) => m.chapters.flatMap((c: any) => c.lessons));

describe('mergePagesIntoTree', () => {
  it('mantém apenas a versão mais completa quando a mesma aula foi salva duas vezes', () => {
    const original = 'controle de fluxo explicado com exemplos praticos de shell '.repeat(60);
    const expanded = `${original}\n\n${'exercicio resolvido de estruturas condicionais '.repeat(60)}`;

    const tree = mergePagesIntoTree(emptyTree, 'apostila-1', [
      { id: 'antiga', title: 'Aula 2', content: original, position: 1 },
      { id: 'nova', title: 'Aula 2', content: expanded, position: 2 },
    ] as any);

    const lessons = lessonsOf(tree);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].id).toBe('page:nova');
    expect(lessons[0].content_md).toBe(expanded);
  });

  it('ignora páginas em branco no sumário', () => {
    const conteudo = 'material valido da aula com bastante explicacao '.repeat(30);
    const tree = mergePagesIntoTree(emptyTree, 'apostila-1', [
      { id: 'vazia', title: 'Nova Página', content: '   ', position: 1 },
      { id: 'valida', title: 'Aula 1', content: conteudo, position: 2 },
    ] as any);

    const lessons = lessonsOf(tree);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].id).toBe('page:valida');
  });

  it('preserva aulas distintas da mesma apostila', () => {
    const a = 'primeira aula sobre variaveis de ambiente no shell '.repeat(30);
    const b = 'segunda aula sobre laços de repeticao e funcoes '.repeat(30);

    const tree = mergePagesIntoTree(emptyTree, 'apostila-1', [
      { id: 'a', title: 'Aula 1', content: a, position: 1 },
      { id: 'b', title: 'Aula 2', content: b, position: 2 },
    ] as any);

    expect(lessonsOf(tree)).toHaveLength(2);
  });

  it('mantém o conteúdo principal quando páginas parciais não cobrem a apostila inteira', () => {
    const main = 'conteúdo completo de sistemas operacionais '.repeat(160);
    const partialPage = 'introdução de sistemas operacionais '.repeat(60);

    expect(shouldRestoreRootContent(main, [
      { id: 'parcial', title: 'Aula 1', content: partialPage, position: 1 },
    ] as any)).toBe(true);
  });

  it('não repete a raiz quando uma página já contém integralmente o mesmo material', () => {
    const main = 'conteúdo completo de sistemas operacionais '.repeat(160);

    expect(shouldRestoreRootContent(main, [
      { id: 'completa', title: 'Material completo', content: `${main}\n\nExercícios de revisão`, position: 1 },
    ] as any)).toBe(false);
  });
});
