import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/pages/ApostilaPage.tsx'), 'utf8');
const rendererSource = readFileSync(resolve(process.cwd(), 'src/components/ApostilaContentRenderer.tsx'), 'utf8');
const readerSource = readFileSync(resolve(process.cwd(), 'src/pages/ApostilaReaderPage.tsx'), 'utf8');

describe('fluxo contínuo da apostila', () => {
  it('renderiza as páginas salvas dentro de um único contêiner de leitura', () => {
    expect(source).toContain('data-apostila-continuous-flow="true"');
    expect(source).toContain('organizedContentBlocks.map((block, blockIndex) => (');
    expect(source).toContain('data-apostila-page-id={block.id}');
  });

  it('não reintroduz cartões independentes para cada página salva', () => {
    expect(source).not.toContain('rounded-3xl border border-border/60 bg-card/70 p-5 sm:p-8 shadow-sm space-y-8');
    expect(source).not.toContain('<article\n                    key={block.id}');
  });

  it('mantém a identificação de data no fluxo contínuo', () => {
    expect(source).toContain('formatApostilaDate(block.savedDate)');
    expect(source).toContain('Conteúdo salvo · página');
  });

  it('mantém o sumário fechado inicialmente para mostrar o conteúdo no primeiro viewport', () => {
    expect(rendererSource).toContain('const [open, setOpen] = useState(false);');
  });

  it('mantém páginas salvas visíveis mesmo quando repetem conteúdo da apostila ou de outra lição', () => {
    expect(source).toContain('const visiblePages = sortedExtraPages.filter((page) => !isPlaceholderPageContent(page.content || \'\'));');
    expect(source).not.toContain('mergeDistinctPages(sortedExtraPages)');
    expect(readerSource).toContain('const visiblePages = pages.filter((page) => !isPlaceholderPageContent(page.content || \'\'));');
    expect(readerSource).not.toContain('existingKeys.has(key)');
    expect(readerSource).not.toContain('existing.includes(key)');
  });
});
