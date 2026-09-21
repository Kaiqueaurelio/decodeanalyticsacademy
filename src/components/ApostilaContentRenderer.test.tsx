import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApostilaContentRenderer } from './ApostilaContentRenderer';

describe('ApostilaContentRenderer', () => {
  it('mantém tabelas HTML como blocos válidos fora de parágrafos', () => {
    const { container } = render(
      <ApostilaContentRenderer
        content={`# Android Runtime\n\nIntrodução ao tema.\n\n<table><thead><tr><th>Camada</th><th>Função</th></tr></thead><tbody><tr><td>ART</td><td>Executa o bytecode.</td></tr></tbody></table>\n\nConclusão.`}
      />,
    );

    const table = container.querySelector('table');
    expect(table).not.toBeNull();
    expect(table?.querySelector('th')?.textContent).toBe('Camada');
    expect(table?.querySelector('td')?.textContent).toBe('ART');
    expect(table?.closest('p')).toBeNull();
    expect(container.textContent).toContain('Conclusão.');
  });

  it.each([
    {
      label: 'HTML completo clonado',
      table: '<table><thead><tr><th>Processo</th><th>Estado</th></tr></thead><tbody><tr><td>Chrome</td><td>Em execução</td></tr></tbody></table>',
      cells: ['Processo', 'Estado', 'Chrome', 'Em execução'],
    },
    {
      label: 'fragmento de linha clonado',
      table: '<tr><td>Processo</td><td>Em execução</td></tr>',
      cells: ['Processo', 'Em execução'],
    },
    {
      label: 'fragmento de células clonado',
      table: '<th>Estado</th><td>Pronto</td>',
      cells: ['Estado', 'Pronto'],
    },
    {
      label: 'fragmento tbody clonado',
      table: '<tbody><tr><td>Memória</td><td>Alocada</td></tr></tbody>',
      cells: ['Memória', 'Alocada'],
    },
    {
      label: 'tabela Markdown clonado por conteúdo web',
      table: '| Recurso | Estado |\n| --- | --- |\n| CPU | Ativa |',
      cells: ['Recurso', 'Estado', 'CPU', 'Ativa'],
    },
  ])('renderiza completamente conteúdo clonado por link: %s', ({ table, cells }) => {
    const { container } = render(
      <ApostilaContentRenderer
        content={`# Sistemas Operacionais\n\n- Escalonamento\n\n${table}\n\nMaterial complementar.`}
      />,
    );

    expect(container.querySelector('h1')?.textContent).toContain('Sistemas Operacionais');
    expect(container.querySelector('ul li')?.textContent).toContain('Escalonamento');
    const tableElement = container.querySelector('table');
    expect(tableElement).not.toBeNull();
    for (const cell of cells) {
      expect(tableElement?.textContent).toContain(cell);
    }
    expect(tableElement?.querySelectorAll('td, th').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('Material complementar.');
  });

  it.each([
    {
      apostila: 'Fundamentos de Processamento de Imagens Digitais',
      content: '# Fundamentos de Processamento de Imagens Digitais\\n\\n## 12.3 Comparação direta\\n\\n<table><tbody><tr><th>Conceito</th><th>O que determina</th></tr><tr><td>Amostragem</td><td>Quantidade e posição dos pontos coletados</td></tr></tbody></table>',
      cells: ['Conceito', 'O que determina', 'Amostragem', 'Quantidade e posição dos pontos coletados'],
    },
    {
      apostila: 'NP2 Teoria dos Grafos: Conceitos, Representações e Algoritmos Clássicos',
      content: '# Teoria dos Grafos\\n\\n- Representações de grafos\\n\\n### 4.8 Matriz x lista de adjacência\\n\\n| Representação | Característica | Melhor uso |\\n| --- | --- | --- |\\n| Matriz de adjacência | Usa matriz n x n | Grafos densos |\\n| Lista de adjacência | Armazena apenas vizinhos | Grafos esparsos |',
      cells: ['Representação', 'Característica', 'Melhor uso', 'Matriz de adjacência', 'Grafo densos'],
    },
    {
      apostila: 'Sistemas Operacionais: Da Estrutura ao Monitoramento de Performance',
      content: '# Sistemas Operacionais\\n\\n- Linha de comando\\n\\n### 2.4 Comparação entre CLI e GUI\\n\\n| Critério | CLI | GUI |\\n| --- | --- | --- |\\n| Forma de uso | Comandos digitados | Elementos visuais |\\n| Automação | Excelente | Limitada |',
      cells: ['Critério', 'CLI', 'GUI', 'Forma de uso', 'Comandos digitados', 'Automação', 'Excelente', 'Limitada'],
    },
  ])('regressão: renderiza tabela de apostila real clonada por link — %s', ({ content, cells }) => {
    const { container } = render(<ApostilaContentRenderer content={content} />);

    expect(container.querySelector('h1')).not.toBeNull();
    expect(container.querySelector('table')).not.toBeNull();
    for (const cell of cells) {
      expect(container.querySelector('table')?.textContent).toContain(cell);
    }
  });

  it('registra diagnóstico quando markup de TD não forma um bloco de tabela', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    render(
      <ApostilaContentRenderer
        content={'# Conteúdo clonado\n\nTexto antes.\n\n<td>célula órfã</td>\n\nTexto depois.'}
      />,
    );

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('markup de tabela'),
      expect.objectContaining({
        sourceCellCount: 1,
      }),
    );
    warn.mockRestore();
  });

  it('mostra um fallback legível quando uma tabela não possui células válidas', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(<ApostilaContentRenderer content={'<table><tbody></tbody></table>'} />);

    expect(container.textContent).toContain('Não foi possível formatar esta tabela.');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Tabela sem células'),
      expect.objectContaining({ sourceLength: expect.any(Number) }),
    );
    warn.mockRestore();
  });

  it('normaliza marcadores de lista numerada escapados vindos do conteúdo legado', () => {
    const { container } = render(
      <ApostilaContentRenderer content={'1\\. Android — Plataforma\n\\n- Tecnologia para dispositivos mobile'} />,
    );

    expect(container.textContent).toContain('Android — Plataforma');
    expect(container.textContent).not.toContain('1\\. Android');
  });

  it('normaliza títulos, listas e separadores escapados do conteúdo legado', () => {
    const { container } = render(
      <ApostilaContentRenderer content={'\\# Teoria da Computação\n\n\\## Máquinas de estado\n\n\\- Autômatos finitos\n\n\\---'} />,
    );

    expect(container.querySelector('h1')?.textContent).toContain('Teoria da Computação');
    expect(container.querySelector('h2')?.textContent).toContain('Máquinas de estado');
    expect(container.textContent).toContain('Autômatos finitos');
    expect(container.textContent).not.toContain('\\#');
    expect(container.textContent).not.toContain('\\-');
  });

  it('preserva todos os itens de uma lista numerada curta', () => {
    const { container } = render(
      <ApostilaContentRenderer content={'1. Android — Plataforma\n2. Android Runtime\n3. Aplicativos Android'} />,
    );

    const items = Array.from(container.querySelectorAll('ol li > span:last-child')).map((item) => item.textContent);
    expect(items).toEqual(['Android — Plataforma', 'Android Runtime', 'Aplicativos Android']);
  });
});
