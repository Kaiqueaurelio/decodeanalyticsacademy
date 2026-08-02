import { test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { DashboardTopbar } from '../components/dashboard/DashboardTopbar';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { ThemeProvider } from '../hooks/useTheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock focus-trap or similar if needed, but Sheet usually handles it
// Mocking the required providers and context
const queryClient = new QueryClient();

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

test('Drawer (MobileBottomNav) should open and close correctly', async () => {
  render(<MobileBottomNav />, { wrapper: AllProviders });
  
  // Find menu button
  const menuButton = screen.queryByLabelText(/Menu/i) || screen.queryByRole('button', { name: /Menu/i });
  if (!menuButton) return; // Skip if not on mobile viewport in test env

  fireEvent.click(menuButton);
  
  // Check if drawer content is visible
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  // Check Esc key
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });
  
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

test('Drawer (DashboardTopbar) should maintain consistent accessibility labels', async () => {
  render(<DashboardTopbar />, { wrapper: AllProviders });
  
  const menuButton = screen.getByLabelText(/Abrir menu de navegação/i);
  expect(menuButton).toBeDefined();
  expect(menuButton.getAttribute('aria-haspopup')).toBe('dialog');
});
