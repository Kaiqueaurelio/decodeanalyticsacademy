import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

/**
 * Navegação por teclado no menu mobile.
 * O menu (bottom nav e topbar) usa o mesmo Sheet, então validamos o Sheet real
 * com o conteúdo típico do menu: links + botões.
 */
function MenuHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button">antes do menu</button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" aria-label="Abrir menu completo" aria-haspopup="dialog" aria-expanded={open}>
            Menu
          </Button>
        </SheetTrigger>
        <SheetContent side="left" aria-label="Menu completo" className="w-[92vw] max-w-[360px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu completo</SheetTitle>
            <SheetDescription>Use Tab para navegar e Esc para fechar.</SheetDescription>
          </SheetHeader>
          <nav aria-label="Navegação do menu">
            <a href="/dashboard">Inicio</a>
            <a href="/exercicios">Exercicios</a>
            <button type="button">Sair</button>
          </nav>
        </SheetContent>
      </Sheet>
      <button type="button">depois do menu</button>
    </>
  );
}

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Abrir menu completo' }));
  await screen.findByRole('dialog');
};

describe('menu mobile — teclado', () => {
  it('abre pelo teclado (Enter) a partir do gatilho', async () => {
    const user = userEvent.setup();
    render(<MenuHarness />);
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Abrir menu completo' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('leva o foco para o botão fechar ao abrir', async () => {
    const user = userEvent.setup();
    render(<MenuHarness />);
    await openMenu(user);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveFocus());
  });

  it('mantém a ordem: fechar → links → botões do menu', async () => {
    const user = userEvent.setup();
    render(<MenuHarness />);
    await openMenu(user);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveFocus());

    await user.tab();
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Exercicios' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Sair' })).toHaveFocus();
  });

  it('prende o foco dentro do menu (Tab no último volta para o primeiro)', async () => {
    const user = userEvent.setup();
    render(<MenuHarness />);
    await openMenu(user);
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Sair' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveFocus();
  });

  it('prende o foco no sentido inverso (Shift+Tab no primeiro vai para o último)', async () => {
    const user = userEvent.setup();
    render(<MenuHarness />);
    await openMenu(user);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveFocus());

    await user.tab({ shift: true });
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    expect(screen.getByRole('button', { name: 'Sair' })).toHaveFocus();
  });

  it('nunca deixa o foco escapar para o conteúdo atrás do menu', async () => {
    const user = userEvent.setup();
    render(<MenuHarness />);
    await openMenu(user);
    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('fecha com Esc e devolve o foco ao gatilho', async () => {
    const user = userEvent.setup();
    render(<MenuHarness />);
    await openMenu(user);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Abrir menu completo' })).toHaveFocus();
  });

  it('fecha pelo botão acionado com o teclado e devolve o foco ao gatilho', async () => {
    const user = userEvent.setup();
    render(<MenuHarness />);
    await openMenu(user);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveFocus());
    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Abrir menu completo' })).toHaveFocus();
  });

  it('expõe estado do gatilho para leitores de tela', async () => {
    const user = userEvent.setup();
    render(<MenuHarness />);
    const trigger = screen.getByRole('button', { name: 'Abrir menu completo' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await openMenu(user);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('menu mobile — contrato do código', () => {
  const read = (f: string) => readFileSync(resolve(process.cwd(), f), 'utf8');

  it('o botão fechar vem antes do conteúdo no Sheet (ordem de foco)', () => {
    const sheet = read('src/components/ui/sheet.tsx');
    const closeIndex = sheet.indexOf('aria-label="Fechar menu"');
    const childrenIndex = sheet.indexOf('{children}');
    expect(closeIndex).toBeGreaterThan(-1);
    expect(closeIndex).toBeLessThan(childrenIndex);
  });

  it('os gatilhos do menu declaram haspopup/expanded', () => {
    for (const file of [
      'src/components/MobileBottomNav.tsx',
      'src/components/dashboard/DashboardTopbar.tsx',
    ]) {
      const source = read(file);
      expect(source).toContain('aria-haspopup="dialog"');
      expect(source).toMatch(/aria-expanded=\{\w+\}/);
    }
  });
});
