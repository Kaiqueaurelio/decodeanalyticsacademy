import { parseApostilaContent } from '@/lib/apostila-parser';

describe('formatação de apostilas importadas', () => {
  it('estrutura títulos isolados em caixa alta sem alterar tabelas', () => {
    const sections = parseApostilaContent(`APOSTILA DE PESQUISA OPERACIONAL

Introdução ao conteúdo.

MODELO MATEMÁTICO

Variáveis, objetivo e restrições.

O1     10   12
O2     20    8`);

    expect(sections.map((section) => section.title)).toEqual([
      'APOSTILA DE PESQUISA OPERACIONAL',
      'MODELO MATEMÁTICO',
    ]);
    expect(sections[1].content).toContain('O1     10   12');
  });
});
