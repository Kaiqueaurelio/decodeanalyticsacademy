import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/hooks/useTheme';
import { AuthProvider } from '@/hooks/useAuth';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import PageSkeleton from '@/components/PageSkeleton';
import SplashScreen from '@/components/SplashScreen';
import RANamePrompt from '@/components/auth/RANamePrompt';
import AdPopup from '@/components/AdPopup';
import AdDraftPreviewOverlay from '@/components/admin/AdDraftPreviewOverlay';
import { EllaSidebar } from '@/components/ella/EllaSidebar';
import PersistentAdSpot from '@/components/PersistentAdSpot';

// Lazy load pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ApostilaPage = lazy(() => import('@/pages/ApostilaPage'));
const ApostilaReaderPage = lazy(() => import('@/pages/ApostilaReaderPage'));
const SubjectPage = lazy(() => import('@/pages/SubjectPage'));
const NotebookPage = lazy(() => import('@/pages/NotebookPage'));
const SimuladoPage = lazy(() => import('@/pages/SimuladoPage'));
const ExercisesPage = lazy(() => import('@/pages/ExercisesPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const BibliotecaPage = lazy(() => import('@/pages/BibliotecaPage'));
const PlayBooksPage = lazy(() => import('@/pages/PlayBooksPage'));
const CoursesPage = lazy(() => import('@/pages/CoursesPage'));
const MaterialsPage = lazy(() => import('@/pages/MaterialsPage'));
const VideoPlayerPage = lazy(() => import('@/pages/VideoPlayerPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AdminApostilaWorkbench = lazy(() => import('@/pages/AdminApostilaWorkbench'));
const AnunciePage = lazy(() => import('@/pages/AnunciePage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const TransparencyPage = lazy(() => import('@/pages/TransparencyPage'));
const OAuthConsentPage = lazy(() => import('@/pages/OAuthConsentPage'));
const OfflinePage = lazy(() => import('@/pages/OfflinePage'));
const SupportProjectPage = lazy(() => import('@/pages/SupportProjectPage'));
const ExerciciosIndexPage = lazy(() => import('@/pages/ExerciciosIndexPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <PageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

function useAdminCopyPatch() {
  const { user } = useAuth();
  React.useEffect(() => {
    const lastPatch = "v5.9.8";
    const patchNotes = "Aula Interativa de Robótica e Games em Aspectos Teóricos.";
    
    if (user && localStorage.getItem('last_patch') !== lastPatch) {
      console.log(`[AdminPatch] Applying ${lastPatch}: ${patchNotes}`);
      localStorage.setItem('last_patch', lastPatch);
    }
  }, [user]);
}

const App = () => {
  const [splashDone, setSplashDone] = React.useState(false);
  useAdminCopyPatch();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AudioPlayerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                {splashDone ? (
                  <>
                    <RANamePrompt />
                    <AdPopup />
                    <AdDraftPreviewOverlay />
                    <EllaSidebar />
                    <PersistentAdSpot />
                  </>
                ) : (
                  <SplashScreen onComplete={() => setSplashDone(true)} />
                )}
                
                <Suspense fallback={<PageSkeleton />}>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/anuncie" element={<AnunciePage />} />
                    <Route path="/termos" element={<TermsPage />} />
                    <Route path="/transparencia" element={<TransparencyPage />} />
                    <Route path="/oauth/callback" element={<OAuthConsentPage />} />
                    <Route path="/offline" element={<OfflinePage />} />
                    <Route path="/apoio" element={<SupportProjectPage />} />

                    {/* App Routes (Protected) */}
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/apostila/:id" element={<ProtectedRoute><ApostilaPage /></ProtectedRoute>} />
                    <Route path="/reader/:id" element={<ProtectedRoute><ApostilaReaderPage /></ProtectedRoute>} />
                    <Route path="/materia/:id" element={<ProtectedRoute><SubjectPage /></ProtectedRoute>} />
                    <Route path="/caderno/:notebookId" element={<ProtectedRoute><NotebookPage /></ProtectedRoute>} />
                    <Route path="/simulado/:id" element={<ProtectedRoute><SimuladoPage /></ProtectedRoute>} />
                    <Route path="/exercises/:id" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
                    <Route path="/exercicios" element={<ProtectedRoute><ExerciciosIndexPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/biblioteca" element={<ProtectedRoute><BibliotecaPage /></ProtectedRoute>} />
                    <Route path="/livros" element={<ProtectedRoute><PlayBooksPage /></ProtectedRoute>} />
                    <Route path="/cursos" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
                    <Route path="/materiais" element={<ProtectedRoute><MaterialsPage /></ProtectedRoute>} />
                    <Route path="/video/:id" element={<ProtectedRoute><VideoPlayerPage /></ProtectedRoute>} />
                    
                    {/* Admin Routes (Protected) */}
                    <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                    <Route path="/admin/apostilas/:id" element={<ProtectedRoute><AdminApostilaWorkbench /></ProtectedRoute>} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AudioPlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
