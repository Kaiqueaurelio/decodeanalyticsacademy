// App root
import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RANamePrompt } from "@/components/RANamePrompt";
import { DynamicWatermark } from "@/components/DynamicWatermark";
import { ScreenshotGuard } from "@/components/ScreenshotGuard";
import { PageSkeleton } from "@/components/PageSkeleton";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { SafeModeBoundary } from "@/components/SafeModeBoundary";
import { SafeModeBanner } from "@/components/SafeModeBanner";

// Lazy: overlays/FABs não-críticos só carregam após o first paint
const CommandPalette = lazy(() => import("@/components/CommandPalette").then(m => ({ default: m.CommandPalette })));
const ScrollToTopFab = lazy(() => import("@/components/ScrollToTopFab").then(m => ({ default: m.ScrollToTopFab })));
const PullToRefresh = lazy(() => import("@/components/PullToRefresh").then(m => ({ default: m.PullToRefresh })));
const QuickActionsFab = lazy(() => import("@/components/QuickActionsFab").then(m => ({ default: m.QuickActionsFab })));
import { useSafeMode } from "@/hooks/useSafeMode";
import { useRouteTracker, getLastRoute } from "@/hooks/useRouteTracker";
import { getLocationRoute, getPageState, getScrollPosition, savePageState, saveScrollPosition } from "@/lib/app-persistence";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { AdPopup } from "@/components/AdPopup";

// Páginas críticas no bundle inicial (rápidas para o primeiro acesso)
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

// Lazy: páginas internas (code-splitting)
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ApostilaPage = lazy(() => import("./pages/ApostilaPage"));
const ExercisesPage = lazy(() => import("./pages/ExercisesPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const MaterialsPage = lazy(() => import("./pages/MaterialsPage"));
const BibliotecaPage = lazy(() => import("./pages/BibliotecaPage"));
const VideoPlayerPage = lazy(() => import("./pages/VideoPlayerPage"));
const AnnouncementDetailPage = lazy(() => import("./pages/AnnouncementDetailPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OfflinePage = lazy(() => import("./pages/OfflinePage"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const SimuladoPage = lazy(() => import("./pages/SimuladoPage"));
const PreExamReviewPage = lazy(() => import("./pages/PreExamReviewPage"));
const TiraDuvidaPage = lazy(() => import("./pages/TiraDuvidaPage"));
const AdminBibliotecaPage = lazy(() => import("./pages/AdminBibliotecaPage"));
const AdminApostilaWorkbench = lazy(() => import("./pages/AdminApostilaWorkbench"));
const PlayBooksPage = lazy(() => import("./pages/PlayBooksPage"));
const PerformancePage = lazy(() => import("./pages/PerformancePage"));
const FlashcardsPage = lazy(() => import("./pages/FlashcardsPage"));
const GlobalAudioPlayer = lazy(() => import("@/components/GlobalAudioPlayer").then(m => ({ default: m.GlobalAudioPlayer })));

// Cache agressivo: dados ficam frescos por 5min, em cache por 30min
// → menos requisições, navegação instantânea entre páginas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Rotas onde a marca d'água + screenshot guard fazem sentido (conteúdo protegido).
// Em login/landing/offline não precisamos pagar esse custo de render contínuo.
const PROTECTED_OVERLAY_ROUTES = [
  "/dashboard", "/desempenho", "/review", "/simulado", "/revisao-prova",
  "/apostila", "/exercises", "/materials", "/video", "/aviso",
  "/comunidade", "/tira-duvida", "/livros", "/playbooks", "/admin",
];

function isProtectedRoute(pathname: string) {
  return PROTECTED_OVERLAY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function WatermarkWrapper() {
  const { user } = useAuth();
  const { enabled: safeMode } = useSafeMode();
  const location = useLocation();
  if (!user) return null;
  if (safeMode) return null;
  // Watermark + screenshot guard apenas em rotas de conteúdo protegido.
  // FABs/CommandPalette ficam disponíveis em todas as rotas autenticadas, mas via
  // <Suspense> (lazy) — não competem pelo first paint.
  const showHeavy = isProtectedRoute(location.pathname);
  return (
    <>
      {showHeavy && <DynamicWatermark />}
      {showHeavy && <ScreenshotGuard />}
      <Suspense fallback={null}>
        <CommandPalette />
        <ScrollToTopFab />
        <PullToRefresh />
        <QuickActionsFab />
      </Suspense>
      <Suspense fallback={null}>
        <GlobalAudioPlayer />
      </Suspense>
      <Suspense fallback={null}>
        <AdPopup trigger="onLoad" delay={3000} />
      </Suspense>
    </>
  );
}

function RouteRestorer() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRestored = React.useRef(false);

  React.useEffect(() => {
    if (loading || hasRestored.current || !user) return;
    if (location.pathname !== '/' && location.pathname !== '/login') {
      hasRestored.current = true;
      return;
    }

    hasRestored.current = true;
    if (user) {
      const last = getLastRoute();
      if (last && last !== '/' && last !== '/login' && last !== location.pathname) {
        navigate(last, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
}

function ScrollRestoration() {
  const location = useLocation();

  React.useEffect(() => {
    const route = getLocationRoute(location);
    const savedPosition = getScrollPosition(route);

    if (savedPosition) {
      window.requestAnimationFrame(() => {
        window.scrollTo(savedPosition.x, savedPosition.y);
      });
      return;
    }

    window.scrollTo({ top: 0, left: 0 });
  }, [location]);

  React.useEffect(() => {
    const route = getLocationRoute(location);
    let pending = false;
    let lastPos = { x: 0, y: 0 };

    const persist = () => {
      saveScrollPosition(route, lastPos);
    };

    // Throttle por rAF — só "agenda" uma gravação por frame em vez de gravar
    // a cada evento de scroll.
    const onScroll = () => {
      lastPos = { x: window.scrollX, y: window.scrollY };
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        // Mantemos em memória; só persistimos no localStorage em pagehide/visibilitychange,
        // o que evita gravar JSON a cada frame de rolagem.
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persist();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      persist();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', persist);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location]);

  return null;
}

function PageStatePersistence() {
  const location = useLocation();

  React.useEffect(() => {
    const route = getLocationRoute(location);
    const persistedFields = getPageState(route);

    if (!persistedFields.length) return;

    window.requestAnimationFrame(() => {
      persistedFields.forEach(({ key, value }) => {
        const element = document.querySelector<HTMLElement>(`[data-persist-key="${CSS.escape(key)}"]`) ??
          document.querySelector<HTMLElement>(`[name="${CSS.escape(key)}"]`) ??
          document.getElementById(key);

        if (!element) return;

        if (element instanceof HTMLInputElement) {
          if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = Boolean(value);
          } else {
            element.value = String(value);
          }
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }

        if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
          element.value = String(value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
  }, [location]);

  React.useEffect(() => {
    const route = getLocationRoute(location);
    let timer: number | undefined;

    // Opt-in: só campos com [data-persist-key] são monitorados.
    // Evita varrer todo o DOM a cada tecla em formulários grandes (Admin/Editor).
    const collectFields = () => {
      const fields = Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          '[data-persist-key]'
        )
      ).map((field, index) => {
        const key = field.getAttribute('data-persist-key') || field.id || `field-${index}`;
        const value = field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')
          ? field.checked
          : field.value;
        return { key, value };
      });

      if (fields.length) savePageState(route, fields);
    };

    const scheduleCollect = () => {
      window.clearTimeout(timer);
      // Debounce 400ms — typing rápido não dispara N varreduras.
      timer = window.setTimeout(collectFields, 400);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        window.clearTimeout(timer);
        collectFields();
      }
    };

    document.addEventListener('input', scheduleCollect, true);
    document.addEventListener('change', scheduleCollect, true);
    window.addEventListener('pagehide', collectFields);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(timer);
      collectFields();
      document.removeEventListener('input', scheduleCollect, true);
      document.removeEventListener('change', scheduleCollect, true);
      window.removeEventListener('pagehide', collectFields);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  useRouteTracker();
  const { enabled: safeMode } = useSafeMode();

  return (
    <>
      <RouteRestorer />
      <PageStatePersistence />
      <ScrollRestoration />
      <WatermarkWrapper />
      <OfflineIndicator />
      <SafeModeBanner />
      {/* Em modo seguro, removemos a animação de transição entre páginas */}
      <div key={location.pathname} className={safeMode ? '' : 'animate-page-in'}>
        <Suspense fallback={<PageSkeleton />}>
          <SafeModeBoundary routeKey={location.pathname}>
            <Routes location={location}>
              <Route path="/livros" element={<PlayBooksPage />} />
              <Route path="/playbooks" element={<PlayBooksPage />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/offline" element={<OfflinePage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/desempenho" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
              <Route path="/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
              <Route path="/simulado" element={<ProtectedRoute><SimuladoPage /></ProtectedRoute>} />
              <Route path="/revisao-prova/:eventId" element={<ProtectedRoute><PreExamReviewPage /></ProtectedRoute>} />
              <Route path="/apostila/:id" element={<ProtectedRoute><ApostilaPage /></ProtectedRoute>} />
              <Route path="/exercises/:id" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/materials" element={<ProtectedRoute><MaterialsPage /></ProtectedRoute>} />
              <Route path="/biblioteca" element={<ProtectedRoute><BibliotecaPage /></ProtectedRoute>} />
              <Route path="/video/:id" element={<ProtectedRoute><VideoPlayerPage /></ProtectedRoute>} />
              <Route path="/aviso/:id" element={<ProtectedRoute><AnnouncementDetailPage /></ProtectedRoute>} />
              <Route path="/comunidade" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
              <Route path="/tira-duvida" element={<ProtectedRoute><TiraDuvidaPage /></ProtectedRoute>} />
              <Route path="/livros" element={<ProtectedRoute><PlayBooksPage /></ProtectedRoute>} />
              <Route path="/playbooks" element={<ProtectedRoute><PlayBooksPage /></ProtectedRoute>} />
              <Route path="/admin/biblioteca" element={<ProtectedRoute adminOnly><AdminBibliotecaPage /></ProtectedRoute>} />
              <Route path="/admin/apostilas/:id" element={<ProtectedRoute adminOnly><AdminApostilaWorkbench /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SafeModeBoundary>
        </Suspense>
      </div>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AudioPlayerProvider>
              <AnimatedRoutes />
              <RANamePrompt />
            </AudioPlayerProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
