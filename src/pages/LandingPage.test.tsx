import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import LandingPage from './LandingPage';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  return {
    motion: new Proxy({}, {
      get: () => React.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>{children}</div>
      )),
    }),
    useScroll: () => ({ scrollYProgress: 0 }),
    useTransform: () => 0,
  };
});

vi.mock('@/components/Reveal', () => ({
  Reveal: ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/TestimonialsSection', () => ({ TestimonialsSection: () => <section /> }));
vi.mock('@/components/CreatorSection', () => ({ CreatorSection: () => <section /> }));
vi.mock('@/components/TechStackSection', () => ({ TechStackSection: () => <section /> }));
vi.mock('@/components/LiveAppSection', () => ({ LiveAppSection: () => <section /> }));
vi.mock('@/components/SocialAndProjectsSection', () => ({ SocialAndProjectsSection: () => <section /> }));
vi.mock('@/components/landing/AppShowcaseSection', () => ({ AppShowcaseSection: () => <section /> }));
vi.mock('@/components/landing/HowItWorksSection', () => ({ HowItWorksSection: () => <section /> }));
vi.mock('@/components/landing/FaqSection', () => ({ FaqSection: () => <section /> }));

describe('LandingPage background video layering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(HTMLMediaElement.prototype, 'load', { configurable: true, value: vi.fn() });
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the video in a single fixed background layer behind landing content', async () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    vi.advanceTimersByTime(900);

    const background = await screen.findByTestId('landing-background');
    const content = screen.getByTestId('landing-content');
    const root = screen.getByTestId('landing-root');

    expect(root).toHaveClass('isolate', 'bg-[#050508]');
    expect(background).toHaveClass('fixed', 'inset-0', 'z-0', 'pointer-events-none');
    expect(content).toHaveClass('relative', 'z-10');
    expect(root).toContainElement(background);
    expect(root).toContainElement(content);

    await waitFor(() => expect(screen.getAllByTestId('landing-background-video')).toHaveLength(1));
    const video = screen.getByTestId('landing-background-video');
    expect(video).toHaveClass('landing-bg-video', 'absolute', 'inset-0', 'object-cover');
    expect(video.closest('[data-testid="landing-background"]')).toBe(background);
    expect(container.querySelectorAll('body > [data-testid="landing-background"]')).toHaveLength(0);
  });

  it('renders hero CTAs and cards in the foreground layer, never inside the video layer', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    const background = screen.getByTestId('landing-background');
    const content = screen.getByTestId('landing-content');
    const mainCta = screen.getByRole('button', { name: /começar a estudar/i });
    const resourcesCta = screen.getByRole('link', { name: /conheça os recursos/i });
    const statsCard = screen.getByText('Disciplinas').closest('div');

    expect(content).toContainElement(mainCta);
    expect(content).toContainElement(resourcesCta);
    expect(statsCard).not.toBeNull();
    expect(content).toContainElement(statsCard as HTMLElement);
    expect(background).not.toContainElement(mainCta);
    expect(background).not.toContainElement(resourcesCta);
    expect(background).not.toContainElement(statsCard as HTMLElement);
  });
});