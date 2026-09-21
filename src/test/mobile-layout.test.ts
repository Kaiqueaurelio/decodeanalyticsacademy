import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Guardas de layout mobile (375px).
 *
 * Estes testes leem o código-fonte das telas críticas no celular e falham
 * quando alguém introduz um padrão que costuma estourar a largura da tela
 * (scroll horizontal) ou tira o menu do fluxo.
 */

const VIEWPORT = 375;

const MOBILE_CRITICAL_FILES = [
  'src/components/MobileBottomNav.tsx',
  'src/components/dashboard/StudentSidebar.tsx',
  'src/components/dashboard/DashboardTopbar.tsx',
  'src/pages/FlashcardsPage.tsx',
  'src/pages/ExerciciosIndexPage.tsx',
  'src/pages/ExercisesPage.tsx',
];

function read(file: string) {
  return readFileSync(resolve(process.cwd(), file), 'utf8');
}

/** Larguras fixas em px declaradas sem prefixo responsivo (sm:/md:/lg:/xl:). */
function fixedPixelWidths(source: string) {
  const found: { raw: string; px: number }[] = [];
  const re = /(^|[\s"'`:])((?:sm|md|lg|xl|2xl):)?(?:min-)?w-\[(\d+)px\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const [raw, , breakpoint, px] = match;
    if (breakpoint) continue; // aplicado só em telas maiores — não afeta 375px
    found.push({ raw: raw.trim(), px: Number(px) });
  }
  return found;
}

describe('layout mobile 375px', () => {
  it.each(MOBILE_CRITICAL_FILES)('%s não usa largura fixa maior que a tela', (file) => {
    const offenders = fixedPixelWidths(read(file)).filter((w) => w.px > VIEWPORT);
    expect(offenders.map((o) => o.raw)).toEqual([]);
  });

  it.each(MOBILE_CRITICAL_FILES)('%s não usa w-screen (causa scroll horizontal com scrollbar)', (file) => {
    expect(read(file)).not.toMatch(/(^|[\s"'`:])w-screen/);
  });

  it.each(MOBILE_CRITICAL_FILES)('%s não usa h-screen (usar h-dvh no mobile)', (file) => {
    expect(read(file)).not.toMatch(/(^|[\s"'`:])h-screen/);
  });
});

describe('navegação mobile', () => {
  const bottomNav = read('src/components/MobileBottomNav.tsx');
  const topbar = read('src/components/dashboard/DashboardTopbar.tsx');

  it('a barra inferior fica fixa e some no desktop', () => {
    expect(bottomNav).toContain('fixed inset-x-0 bottom-0');
    expect(bottomNav).toContain('md:hidden');
  });

  it('a barra inferior reserva espaço para não cobrir o conteúdo', () => {
    expect(bottomNav).toMatch(/aria-hidden className="h-24 md:hidden"/);
  });

  it('a barra inferior respeita a safe area do iOS', () => {
    expect(bottomNav).toContain('env(safe-area-inset-bottom)');
  });

  it('a barra Meniscus é fluida e não força largura fixa no celular', () => {
    expect(bottomNav).toContain('max-w-[430px]');
    expect(bottomNav).toContain('w-full');
    expect(bottomNav).toContain('rounded-[38px]');
    expect(bottomNav).not.toMatch(/w-\[min\(/);
  });

  it('o menu lateral continua acessível pelo topo no mobile', () => {
    expect(topbar).toContain('lg:hidden');
    expect(topbar).toContain('aria-label="Abrir menu de navegação"');
  });

  it('os alvos de toque têm pelo menos 44px', () => {
    expect(bottomNav).toMatch(/min-h-\[5[0-9]px\]/);
    expect(topbar).toMatch(/h-11 w-11/);
  });

  it('a navegação não depende só de hover (foco visível e estado atual)', () => {
    expect(bottomNav).toContain('focus-visible:ring-2');
    expect(bottomNav).toContain("aria-current={active ? 'page' : undefined}");
    expect(topbar).toContain('focus-visible:ring-2');
  });
});

describe('identidade da sessão no menu lateral', () => {
  const sidebar = read('src/components/dashboard/StudentSidebar.tsx');

  it('distingue visualmente administrador de aluno', () => {
    expect(sidebar).toContain("isAdmin ? 'Administrador conectado' : 'Aluno conectado'");
  });
});

describe('páginas de estudo no mobile', () => {
  it.each([
    ['src/pages/ExerciciosIndexPage.tsx'],
    ['src/pages/FlashcardsPage.tsx'],
  ])('%s usa container fluido com padding lateral', (file) => {
    const source = read(file);
    expect(source).toMatch(/w-full|max-w-/);
    expect(source).toMatch(/px-[2-6]/);
  });

  it('grades começam em uma coluna no celular', () => {
    for (const file of ['src/pages/ExerciciosIndexPage.tsx', 'src/pages/FlashcardsPage.tsx']) {
      const grids = [...read(file).matchAll(/grid-cols-\d+/g)].map((m) => m[0]);
      const unprefixed = [...read(file).matchAll(/(^|[\s"'`])grid-cols-(\d+)/g)]
        .map((m) => Number(m[2]))
        .filter((n) => n > 1);
      expect({ file, grids: unprefixed }).toEqual({ file, grids: [] });
      void grids;
    }
  });
});


describe('topbar desktop com sidebar expandida', () => {
  const topbar = read('src/components/dashboard/DashboardTopbar.tsx');

  it('não exibe o bloco de atalhos administrativos no espaço intermediário', () => {
    expect(topbar).toContain('hidden min-[1500px]:flex items-center gap-1');
  });

  it('reduz Painel Admin para ícone antes da faixa larga', () => {
    expect(topbar).toContain('hidden min-[1400px]:flex h-9');
    expect(topbar).toContain('min-[1400px]:hidden h-9 w-9');
  });

  it('permite que a busca encolha sem esmagar os controles laterais', () => {
    expect(topbar).toContain('min-w-0 flex-1 basis-0 max-w-2xl');
    expect(topbar).toContain('ml-auto flex shrink-0 items-center');
  });
});


describe('topbar intermediário com sidebar expandida', () => {
  const topbar = read('src/components/dashboard/DashboardTopbar.tsx');

  it('compacta a identidade do usuário antes da faixa larga', () => {
    expect(topbar).toContain('flex shrink-0 items-center gap-1.5 sm:gap-2.5');
    expect(topbar).toContain('hidden min-[1400px]:block leading-tight text-left');
    expect(topbar).toContain('hidden min-[1400px]:block h-3.5 w-3.5');
  });
});
