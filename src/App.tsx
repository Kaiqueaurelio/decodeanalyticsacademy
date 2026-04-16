// App root
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DynamicWatermark } from "@/components/DynamicWatermark";
import { useRouteTracker, getLastRoute } from "@/hooks/useRouteTracker";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import ApostilaPage from "./pages/ApostilaPage";
import ExercisesPage from "./pages/ExercisesPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import MaterialsPage from "./pages/MaterialsPage";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function WatermarkWrapper() {
  const { user } = useAuth();
  if (!user) return null;
  return <DynamicWatermark />;
}

function RouteRestorer() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRestored = React.useRef(false);

  React.useEffect(() => {
    if (loading || hasRestored.current) return;
    hasRestored.current = true;
    if (user && (location.pathname === '/' || location.pathname === '/login')) {
      const last = getLastRoute();
      if (last && last !== '/' && last !== '/login') {
        navigate(last, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();
  useRouteTracker();
  useInactivityLogout();

  return (
    <>
      <RouteRestorer />
      <WatermarkWrapper />
      <div key={location.pathname} className="animate-page-in">
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/apostila/:id" element={<ProtectedRoute><ApostilaPage /></ProtectedRoute>} />
          <Route path="/exercises/:id" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><MaterialsPage /></ProtectedRoute>} />
          <Route path="/video/:id" element={<ProtectedRoute><VideoPlayerPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
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
            <AnimatedRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
