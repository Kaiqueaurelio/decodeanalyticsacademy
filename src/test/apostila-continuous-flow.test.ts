import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve(process.cwd(), 'src/pages/ApostilaPage.tsx'), 'utf8');
const rendererSource = readFileSync(resolve(process.cwd(), 'src/components/ApostilaContentRenderer.tsx'), 'utf8');

describe('fluxo contínuo da apostila', () => {
  it('renderiza as páginas salvas dentro de um único contêiner de leitura', () => {
    expect(source).toContain('data-apostila-continuous-flow="true"');
    expect(source).toContain('contentBlocks.map((block, blockIndex) => (');
    expect(source).toContain('<ApostilaContentBoundary content={block.content} />');
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
    expect(source).toContain('const [visualTocOpen, setVisualTocOpen] = useState(false);');
    expect(source).toContain('{visualTocOpen ? <ol id="apostila-visual-toc" className="py-1">');
  });

  it('usa as páginas salvas como fonte principal quando o campo principal está vazio', () => {
    expect(source).toContain("validPages.length > 0 ? '' : structuredContent");
  });
});
