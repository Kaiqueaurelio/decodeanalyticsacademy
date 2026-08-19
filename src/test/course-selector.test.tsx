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
  });
});
