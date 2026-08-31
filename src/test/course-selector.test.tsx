import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApostilaHealthBar } from '../components/admin/AdminNotionEditorHeader';

describe('ApostilaHealthBar course selector', () => {
  it('toggles a course and reports the selected course list', () => {
    const onCourseChange = vi.fn();

    render(
      <ApostilaHealthBar
        title="Pesquisa Operacional"
        published
        saving={false}
        lastSavedAt={null}
        onSave={vi.fn()}
        onTogglePublish={vi.fn()}
        onPreview={vi.fn()}
        onOpenPanel={vi.fn()}
        wordCount={1200}
        exerciseCount={10}
        materialCount={2}
        onPasteOpen={vi.fn()}
        onAddPage={vi.fn()}
        course={['CC']}
        onCourseChange={onCourseChange}
      />,
    );

    const ccButton = screen.getByRole('button', { name: 'Curso CC' });
    const siButton = screen.getByRole('button', { name: 'Curso SI' });

    expect(ccButton).toHaveAttribute('aria-pressed', 'true');
    expect(siButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(siButton);
    expect(onCourseChange).toHaveBeenLastCalledWith(['CC', 'SI']);

    fireEvent.click(ccButton);
    expect(onCourseChange).toHaveBeenLastCalledWith([]);
  }, 15_000);

  it('exposes a controlled button to retract and reopen the apostila list', () => {
    const onToggleSidebar = vi.fn();

    const { rerender } = render(
      <ApostilaHealthBar
        title="Aspectos Teóricos da Computação"
        published
        saving={false}
        lastSavedAt={null}
        onSave={vi.fn()}
        onTogglePublish={vi.fn()}
        onPreview={vi.fn()}
        onOpenPanel={vi.fn()}
        wordCount={3890}
        exerciseCount={0}
        materialCount={0}
        onPasteOpen={vi.fn()}
        onAddPage={vi.fn()}
        sidebarCollapsed={false}
        onToggleSidebar={onToggleSidebar}
      />,
    );

    const collapseButton = screen.getByRole('button', { name: 'Recolher lista de apostilas' });
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    expect(collapseButton).toHaveAttribute('aria-controls', 'workbench-apostila-sidebar');
    fireEvent.click(collapseButton);
    expect(onToggleSidebar).toHaveBeenCalledOnce();

    rerender(
      <ApostilaHealthBar
        title="Aspectos Teóricos da Computação"
        published
        saving={false}
        lastSavedAt={null}
        onSave={vi.fn()}
        onTogglePublish={vi.fn()}
        onPreview={vi.fn()}
        onOpenPanel={vi.fn()}
        wordCount={3890}
        exerciseCount={0}
        materialCount={0}
        onPasteOpen={vi.fn()}
        onAddPage={vi.fn()}
        sidebarCollapsed
        onToggleSidebar={onToggleSidebar}
      />,
    );

    expect(screen.getByRole('button', { name: 'Abrir lista de apostilas' }))
      .toHaveAttribute('aria-expanded', 'false');
  }, 15_000);
});
