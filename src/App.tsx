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
import { BiometricLockGate } from "@/components/BiometricLockGate";
import { BiometricOnboarding } from "@/components/BiometricOnboarding";
import { RANamePrompt } from "@/components/RANamePrompt";
import { DynamicWatermark } from "@/components/DynamicWatermark";
import { ScreenshotGuard } from "@/components/ScreenshotGuard";
import { CommandPalette } from "@/components/CommandPalette";
import { ScrollToTopFab } from "@/components/ScrollToTopFab";
import { PullToRefresh } from "@/components/PullToRefresh";
import { PageSkeleton } from "@/components/PageSkeleton";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { QuickActionsFab } from "@/components/QuickActionsFab";
import { useRouteTracker, getLastRoute } from "@/hooks/useRouteTracker";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import { getLocationRoute, getPageState, getScrollPosition, savePageState, saveScrollPosition } from "@/lib/app-persistence";

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

const queryClient = new QueryClient();

function WatermarkWrapper() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <DynamicWatermark />
      <ScreenshotGuard />
      <CommandPalette />
      <ScrollToTopFab />
      <PullToRefresh />
      <QuickActionsFab />
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

    const persistScroll = () => {
      saveScrollPosition(route, {
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistScroll();
    };

    window.addEventListener('scroll', persistScroll, { passive: true });
    window.addEventListener('pagehide', persistScroll);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      persistScroll();
      window.removeEventListener('scroll', persistScroll);
      window.removeEventListener('pagehide', persistScroll);
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

    const collectFields = () => {
      const fields = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select'))
        .filter((field) => {
          if (field instanceof HTMLInputElement) {
            return !['password', 'file', 'hidden', 'submit'].includes(field.type);
          }

          return true;
        })
        .map((field, index) => {
          const key = field.getAttribute('data-persist-key') || field.getAttribute('name') || field.id || `field-${index}`;
          const value = field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')
            ? field.checked
            : field.value;

          return { key, value };
        });

      savePageState(route, fields);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') collectFields();
    };

    document.addEventListener('input', collectFields, true);
    document.addEventListener('change', collectFields, true);
    window.addEventListener('pagehide', collectFields);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      collectFields();
      document.removeEventListener('input', collectFields, true);
      document.removeEventListener('change', collectFields, true);
      window.removeEventListener('pagehide', collectFields);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  useRouteTracker();
  useInactivityLogout();

  return (
    <>
      <RouteRestorer />
      <PageStatePersistence />
      <ScrollRestoration />
      <WatermarkWrapper />
      <OfflineIndicator />
      <div key={location.pathname} className="animate-page-in">
        <Suspense fallback={<PageSkeleton />}>
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/offline" element={<OfflinePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
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
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
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
            <BiometricLockGate>
              <AnimatedRoutes />
              <BiometricOnboarding />
              <RANamePrompt />
            </BiometricLockGate>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
