import {
  ROUTE_KEY,
  bootstrapSavedRoute,
  clearLastRoute,
  isAdministrativePath,
  isPersistablePath,
  saveLastRoute,
} from '../lib/app-persistence';

describe('persistência segura de rotas', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    localStorage.clear();
  });

  afterEach(() => {
    clearLastRoute();
    window.history.replaceState({}, '', '/');
  });

  it('classifica o painel administrativo e suas subrotas como não restauráveis', () => {
    expect(isAdministrativePath('/admin')).toBe(true);
    expect(isAdministrativePath('/admin/apostilas/123')).toBe(true);
    expect(isAdministrativePath('/dashboard')).toBe(false);
    expect(isPersistablePath('/dashboard')).toBe(true);
    expect(isPersistablePath('/admin')).toBe(false);
    expect(isPersistablePath('/admin/biblioteca')).toBe(false);
  });

  it('não grava uma rota administrativa como última rota', () => {
    saveLastRoute('/admin?tab=overview');
    expect(localStorage.getItem(ROUTE_KEY)).toBeNull();

    saveLastRoute('/dashboard');
    expect(localStorage.getItem(ROUTE_KEY)).toBe('/dashboard');
  });

  it('remove uma rota administrativa antiga antes de restaurar a página', () => {
    localStorage.setItem(ROUTE_KEY, '/admin/apostilas/123');
    bootstrapSavedRoute();

    expect(window.location.pathname).toBe('/');
    expect(localStorage.getItem(ROUTE_KEY)).toBeNull();
  });

  it('continua restaurando uma rota estudantil válida', () => {
    localStorage.setItem(ROUTE_KEY, '/dashboard#apostilas');
    bootstrapSavedRoute();

    expect(window.location.pathname).toBe('/dashboard');
    expect(window.location.hash).toBe('#apostilas');
  });
});
