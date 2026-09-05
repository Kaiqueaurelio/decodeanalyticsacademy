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
import { PageSkeleton } from '@/components/PageSkeleton';
import { SplashScreen } from '@/components/SplashScreen';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RANamePrompt } from '@/components/RANamePrompt';
import { AdPopup } from '@/components/AdPopup';
import { AdDraftPreviewOverlay } from '@/components/admin/AdDraftPreviewOverlay';
import { EllaSidebar } from '@/components/ella/EllaSidebar';
import { PersistentAdSpot } from '@/components/PersistentAdSpot';
import { StudentAppShell } from '@/components/dashboard/StudentAppShell';
import { useBMCWidget } from '@/hooks/useBMCWidget';

// Lazy load pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ApostilaPage = lazy(() => import('@/pages/ApostilaPage'));
const ApostilaReaderPage = lazy(() => import('@/pages/ApostilaReaderPage'));
const ApostilaDoDiaPage = lazy(() => import('@/pages/ApostilaDoDiaPage'));
const SubjectPage = lazy(() => import('@/pages/SubjectPage'));
const NotebookPage = lazy(() => import('@/pages/NotebookPage'));
const SimuladoPage = lazy(() => import('@/pages/SimuladoPage'));
const ExercisesPage = lazy(() => import('@/pages/ExercisesPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const BibliotecaPage = lazy(() => import('@/pages/BibliotecaPage'));
const PlayBooksPage = lazy(() => import('@/pages/PlayBooksPage'));
const CoursesPage = lazy(() => import('@/pages/CoursesPage'));
const JobsPage = lazy(() => import('@/pages/JobsPage'));
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
const GabaritosPage = lazy(() => import('@/pages/GabaritosPage'));
const EventsPage = lazy(() => import('@/pages/EventsPage'));
  const CalculadoraPage = lazy(() => import('@/pages/CalculadoraPage'));
  const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
  const EllaPage = lazy(() => import('@/pages/EllaPage'));
  const FlashcardsPage = lazy(() => import('@/pages/FlashcardsPage'));
  const NewsPage = lazy(() => import('@/pages/NewsPage'));
  const PerformancePage = lazy(() => import('@/pages/PerformancePage'));
  const PlanoEstudosPage = lazy(() => import('@/pages/PlanoEstudosPage'));
  const PreExamReviewPage = lazy(() => import('@/pages/PreExamReviewPage'));
  const ReviewPage = lazy(() => import('@/pages/ReviewPage'));
  const SchedulePage = lazy(() => import('@/pages/SchedulePage'));
  const TiraDuvidaPage = lazy(() => import('@/pages/TiraDuvidaPage'));
  const AdminBibliotecaPage = lazy(() => import('@/pages/AdminBibliotecaPage'));
  const AdminContentCenterPage = lazy(() => import('@/pages/AdminContentCenterPage'));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function useAdminCopyPatch() {
  const { user } = useAuth();
  React.useEffect(() => {
    const lastPatch = "v6.0.2";
    const patchNotes = "Security Hardening: Dependency upgrades and credential cleanup.";
    
    if (user && localStorage.getItem('last_patch') !== lastPatch) {
      console.log(`[AdminPatch] Applying ${lastPatch}: ${patchNotes}`);
      localStorage.setItem('last_patch', lastPatch);
    }
  }, [user]);
}

const AppContent = () => {
  const [splashDone, setSplashDone] = React.useState(false);
  const [showContent, setShowContent] = React.useState(false);
  useAdminCopyPatch();
  useBMCWidget();

  // Mantém a identidade da callback para não reiniciar o timer do splash a cada render.
  const handleSplashComplete = React.useCallback(() => {
    setSplashDone(true);
  }, []);

  React.useEffect(() => {
    if (splashDone) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    }
  }, [splashDone]);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      
      <div 
        className={`transition-opacity duration-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={!splashDone}
      >
        {splashDone && (
          <>
            <RANamePrompt />
            <AdPopup />
            <AdDraftPreviewOverlay />
            <EllaSidebar />
            <PersistentAdSpot />
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
                <Route path="/anuncie" element={<AnunciePage />} />
                <Route path="/termos" element={<TermsPage />} />
                <Route path="/transparencia" element={<TransparencyPage />} />
                <Route path="/oauth/callback" element={<OAuthConsentPage />} />
                <Route path="/offline" element={<OfflinePage />} />
                <Route path="/apoio" element={<SupportProjectPage />} />

                {/* App Routes (Protected) */}
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/apostila/:id" element={<ProtectedRoute><StudentAppShell><ApostilaPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/reader/:id" element={<ProtectedRoute><StudentAppShell><ApostilaReaderPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/aula-do-dia" element={<ProtectedRoute><StudentAppShell><ApostilaDoDiaPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/materia/:id" element={<ProtectedRoute><StudentAppShell><SubjectPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/caderno/:notebookId" element={<ProtectedRoute><StudentAppShell><NotebookPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/simulado/:id" element={<ProtectedRoute><StudentAppShell><SimuladoPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/exercises/:id" element={<ProtectedRoute><StudentAppShell><ExercisesPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/exercicios" element={<ProtectedRoute><StudentAppShell><ExerciciosIndexPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/gabaritos" element={<ProtectedRoute><StudentAppShell><GabaritosPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/eventos" element={<ProtectedRoute><StudentAppShell><EventsPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><StudentAppShell><ProfilePage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/biblioteca" element={<ProtectedRoute><StudentAppShell><BibliotecaPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/livros" element={<ProtectedRoute><StudentAppShell><PlayBooksPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/cursos" element={<ProtectedRoute><StudentAppShell><CoursesPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/vagas" element={<JobsPage />} />
                <Route path="/materiais" element={<ProtectedRoute><StudentAppShell><MaterialsPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/video/:id" element={<ProtectedRoute><StudentAppShell><VideoPlayerPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/calculadora" element={<ProtectedRoute><StudentAppShell><CalculadoraPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/comunidade" element={<ProtectedRoute><StudentAppShell><CommunityPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/ella" element={<ProtectedRoute><StudentAppShell><EllaPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/flashcards" element={<ProtectedRoute><StudentAppShell><FlashcardsPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/noticias" element={<ProtectedRoute><StudentAppShell><NewsPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/performance" element={<ProtectedRoute><StudentAppShell><PerformancePage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/plano-de-estudos" element={<ProtectedRoute><StudentAppShell><PlanoEstudosPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/revisao-prova/:eventId" element={<ProtectedRoute><StudentAppShell><PreExamReviewPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/review" element={<ProtectedRoute><StudentAppShell><ReviewPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/horarios" element={<ProtectedRoute><StudentAppShell><SchedulePage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/tira-duvida" element={<ProtectedRoute><StudentAppShell><TiraDuvidaPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/tira-duvidas" element={<Navigate to="/tira-duvida" replace />} />

                <Route path="/simulado" element={<ProtectedRoute><StudentAppShell><SimuladoPage /></StudentAppShell></ProtectedRoute>} />
                <Route path="/apoie" element={<Navigate to="/apoio" replace />} />
                <Route path="/apostilas" element={<Navigate to="/dashboard#apostilas" replace />} />
                <Route path="/community" element={<Navigate to="/comunidade" replace />} />
                <Route path="/jobs" element={<Navigate to="/vagas" replace />} />
                <Route path="/desempenho" element={<Navigate to="/performance" replace />} />
                <Route path="/materials" element={<Navigate to="/materiais" replace />} />
                <Route path="/messages" element={<Navigate to="/comunidade" replace />} />
                <Route path="/patrocine" element={<Navigate to="/anuncie" replace />} />
                <Route path="/perfil" element={<Navigate to="/profile" replace />} />
                <Route path="/terms" element={<Navigate to="/termos" replace />} />
                <Route path="/transparency" element={<Navigate to="/transparencia" replace />} />
                
                {/* Admin Routes (Protected) */}
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
                <Route path="/admin/apostilas/:id" element={<ProtectedRoute adminOnly><AdminApostilaWorkbench /></ProtectedRoute>} />
                <Route path="/admin/biblioteca" element={<ProtectedRoute adminOnly><AdminBibliotecaPage /></ProtectedRoute>} />
                <Route path="/admin/conteudo" element={<ProtectedRoute adminOnly><AdminContentCenterPage /></ProtectedRoute>} />
                <Route path="/admin/financeiro" element={<Navigate to="/admin?tab=overview" replace />} />
                <Route path="/admin/relatorios" element={<Navigate to="/admin?tab=overview" replace />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </>
        )}
      </div>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AudioPlayerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </TooltipProvider>
          </AudioPlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
