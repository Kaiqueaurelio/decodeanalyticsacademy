import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CoverPreviewSizes } from '@/components/admin/CoverPreviewSizes';
import { DEFAULT_COVER_THEME } from '@/lib/cover-theme';

describe('CoverPreviewSizes', () => {
  it('renders all real-size previews', () => {
    render(<CoverPreviewSizes samples={[{ title: 'Teoria dos Grafos', category: 'Teoria dos Grafos', semester: 5 }]} theme={DEFAULT_COVER_THEME} />);
    for (const id of ['card-mobile', 'card-desktop', 'reader', 'print']) {
      expect(screen.getByTestId(`cover-size-${id}`)).toBeTruthy();
    }
  });
});
