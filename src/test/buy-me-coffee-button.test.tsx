import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BuyMeCoffeeButton from '@/components/BuyMeCoffeeButton';

describe('BuyMeCoffeeButton', () => {
  it('uses the app visual language without the oversized remote image', () => {
    const { container } = render(
      <BuyMeCoffeeButton variant="minimal" size="small" text="Apoiar o projeto" />,
    );

    const link = screen.getByRole('link', { name: 'Apoiar a Decode Analytics Academy no Buy Me a Coffee' });
    expect(link).toHaveAttribute('href', 'https://www.buymeacoffee.com/decodeanalyticsacademy');
    expect(link).toHaveTextContent('Apoiar o projeto');
    expect(container.querySelector('img')).toBeNull();
  });

  it('keeps an accessible label in compact icon-only mode', () => {
    render(<BuyMeCoffeeButton showText={false} text="Apoiar" />);
    expect(screen.getByRole('link', { name: 'Apoiar a Decode Analytics Academy no Buy Me a Coffee' }))
      .toHaveTextContent('Apoiar');
  });
});
