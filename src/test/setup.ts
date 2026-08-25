import "@testing-library/jest-dom";

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// O cliente Supabase é inicializado no import; os testes unitários não devem
// depender de segredos ou de uma sessão remota real.
vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');
vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key');

afterEach(() => cleanup());

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
