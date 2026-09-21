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
    ['uma linha HTML clonada', '<tr><td>Processo</td><td>Em execução</td></tr>', 'Processo', 'Em execução'],
    ['células HTML clonadas', '<th>Estado</th><td>Pronto</td>', 'Estado', 'Pronto'],
    ['um tbody HTML clonado', '<tbody><tr><td>Memória</td><td>Alocada</td></tr></tbody>', 'Memória', 'Alocada'],
  ])('reconstrói tabela a partir de %s', (_label, tableFragment, firstCell, secondCell) => {
    const { container } = render(
      <ApostilaContentRenderer
        content={`# Sistemas Operacionais\n\n- Escalonamento\n\n${tableFragment}\n\nMaterial complementar.`}
      />,
    );

    const table = container.querySelector('table');
    expect(container.querySelector('h1')?.textContent).toContain('Sistemas Operacionais');
    expect(container.querySelector('ul li')?.textContent).toContain('Escalonamento');
    expect(table).not.toBeNull();
    expect(table?.textContent).toContain(firstCell);
    expect(table?.textContent).toContain(secondCell);
    expect(container.textContent).toContain('Material complementar.');
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
