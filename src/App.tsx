import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RANamePrompt } from "@/components/RANamePrompt";
import { PageSkeleton } from "@/components/PageSkeleton";
import "@/styles/polish.css";
import "@/styles/landing-motion.css";
import "@/styles/ella-and-ads.css";
import "@/styles/reader.css";
// BUGFIX: AudioPlayerProvider NAO pode ser lazy-loaded pois e um Context Provider.
// Lazy-loading um Provider causa crash/reset de contexto ao remontar.
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { SplashScreen } from "@/components/SplashScreen";
import { AdFooterMobile } from "@/components/AdFooterMobile";
import { AdPopup } from "@/components/AdPopup";
import { PersistentAdSpot } from "@/components/PersistentAdSpot";
import { AdDraftPreviewOverlay } from "@/components/admin/AdDraftPreviewOverlay";

import { TermsFooterLink } from "@/components/TermsFooterLink";
import { EllaSidebar } from "@/components/ella/EllaSidebar";
import { PageTransition } from "@/components/PageTransition";
import { ForcePasswordChangeGate } from "@/components/ForcePasswordChangeGate";

// Paginas criticas no bundle inicial
import LandingPage from "./pages/LandingPage";
import AnunciePage from "./pages/AnunciePage";
import LoginPage from "./pages/LoginPage";

// Lazy: paginas internas (code-splitting)
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ApostilaPage = lazy(() => import("./pages/ApostilaPage"));
const ApostilaReaderPage = lazy(() => import("./pages/ApostilaReaderPage"));
const SubjectPage = lazy(() => import("./pages/SubjectPage"));
const ExercisesPage = lazy(() => import("./pages/ExercisesPage"));
const ExerciciosIndexPage = lazy(() => import("./pages/ExerciciosIndexPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const MaterialsPage = lazy(() => import("./pages/MaterialsPage"));
const BibliotecaPage = lazy(() => import("./pages/BibliotecaPage"));
const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const VideoPlayerPage = lazy(() => import("./pages/VideoPlayerPage"));
const AnnouncementDetailPage = lazy(() => import("./pages/AnnouncementDetailPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CoverCardVisualPage = lazy(() => import("./pages/visual/CoverCardVisualPage"));
const OfflinePage = lazy(() => import("./pages/OfflinePage"));
const ReviewPage = lazy(() => import("./pages/ReviewPage"));
const SimuladoPage = lazy(() => import("./pages/SimuladoPage"));
const PlanoEstudosPage = lazy(() => import("./pages/PlanoEstudosPage"));
const PreExamReviewPage = lazy(() => import("./pages/PreExamReviewPage"));
const TiraDuvidaPage = lazy(() => import("./pages/TiraDuvidaPage"));
const AdminBibliotecaPage = lazy(() => import("./pages/AdminBibliotecaPage"));
const AdminApostilaWorkbench = lazy(() => import("./pages/AdminApostilaWorkbench"));
const PlayBooksPage = lazy(() => import("./pages/PlayBooksPage"));
const PerformancePage = lazy(() => import("./pages/PerformancePage"));
const FlashcardsPage = lazy(() => import("./pages/FlashcardsPage"));
const CalculadoraPage = lazy(() => import("./pages/CalculadoraPage"));
const EllaPage = lazy(() => import("./pages/EllaPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const OAuthConsentPage = lazy(() => import("./pages/OAuthConsentPage"));

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

function useAdminCopyPatch() {
  React.useEffect(() => {
    const replacements = new Map([
      ["Assistente de anuncios", "Ella Ribeiro"],
      ["Assistente de anúncios", "Ella Ribeiro"],
      ["Ads Chat Builder", "Ella Ribeiro"],
      ["Copiloto do App", "Ella Ribeiro"],
      ["Copilot App", "Ella Ribeiro"],
      ["Gere criativos de anúncios com IA", "Assistente operacional para tarefas do app"],
      ["oque vc acha que podemos melhorar no app por gentileza ??", "oque vc acha que podemos melhorar no app por gentileza ??"],
    ]);

    const patchCopy = () => {
      document.querySelectorAll("h1,h2,h3,p,span").forEach((node) => {
        const current = node.textContent?.trim();
        const next = current ? replacements.get(current) : undefined;

        if (next && node.textContent !== next) {
          node.textContent = next;
        }
      });
    };

    patchCopy();

    const observer = new MutationObserver(patchCopy);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);
}

function AnimatedRoutes() {
  const [showSplash, setShowSplash] = React.useState(true);
  useAdminCopyPatch();

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Suspense fallback={<PageSkeleton />}>
      <PageTransition>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="/auth/*" element={<Navigate to="/login" replace />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/anuncie" element={<AnunciePage />} />
        <Route path="/patrocine" element={<Navigate to="/anuncie" replace />} />
        <Route path="/.lovable/oauth/consent" element={<OAuthConsentPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/desempenho" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
        <Route path="/performance" element={<Navigate to="/desempenho" replace />} />
        <Route path="/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
        <Route path="/simulado" element={<ProtectedRoute><SimuladoPage /></ProtectedRoute>} />
        <Route path="/plano-de-estudos" element={<ProtectedRoute><PlanoEstudosPage /></ProtectedRoute>} />
        <Route path="/revisao-prova/:eventId" element={<ProtectedRoute><PreExamReviewPage /></ProtectedRoute>} />
        <Route path="/apostila/:id" element={<ProtectedRoute><ApostilaPage /></ProtectedRoute>} />
        <Route path="/apostila/:id/read" element={<ProtectedRoute><ApostilaReaderPage /></ProtectedRoute>} />
        <Route path="/materia/:category" element={<ProtectedRoute><SubjectPage /></ProtectedRoute>} />
        <Route path="/exercises/:id" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
        <Route path="/exercicios" element={<ProtectedRoute><ExerciciosIndexPage /></ProtectedRoute>} />
        <Route path="/exercises" element={<Navigate to="/exercicios" replace />} />
        <Route path="/apostilas" element={<Navigate to="/dashboard" replace />} />

        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/materials" element={<ProtectedRoute blockForEnem><MaterialsPage /></ProtectedRoute>} />
        <Route path="/materiais" element={<Navigate to="/materials" replace />} />
        <Route path="/biblioteca" element={<ProtectedRoute blockForEnem><BibliotecaPage /></ProtectedRoute>} />
        <Route path="/cursos" element={<ProtectedRoute blockForEnem><CoursesPage /></ProtectedRoute>} />
        <Route path="/video/:id" element={<ProtectedRoute blockForEnem><VideoPlayerPage /></ProtectedRoute>} />
        <Route path="/aviso/:id" element={<ProtectedRoute><AnnouncementDetailPage /></ProtectedRoute>} />
        <Route path="/comunidade" element={<ProtectedRoute blockForEnem><CommunityPage /></ProtectedRoute>} />
        <Route path="/tira-duvida" element={<ProtectedRoute blockForEnem><TiraDuvidaPage /></ProtectedRoute>} />
        <Route path="/livros" element={<ProtectedRoute blockForEnem><PlayBooksPage /></ProtectedRoute>} />
        <Route path="/playbooks" element={<ProtectedRoute blockForEnem><PlayBooksPage /></ProtectedRoute>} />
        <Route path="/flashcards" element={<ProtectedRoute blockForEnem><FlashcardsPage /></ProtectedRoute>} />
        <Route path="/calculadora" element={<ProtectedRoute blockForEnem><CalculadoraPage /></ProtectedRoute>} />
        <Route path="/ella" element={<ProtectedRoute><EllaPage /></ProtectedRoute>} />
        <Route path="/noticias" element={<ProtectedRoute blockForEnem><NewsPage /></ProtectedRoute>} />
        <Route path="/admin/biblioteca" element={<ProtectedRoute adminOnly><AdminBibliotecaPage /></ProtectedRoute>} />
        <Route path="/admin/apostilas/:id" element={<ProtectedRoute adminOnly><AdminApostilaWorkbench /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        {import.meta.env.DEV && (
          <Route path="/__visual/cover-card" element={<CoverCardVisualPage />} />
        )}
        <Route path="*" element={<NotFound />} />

      </Routes>
      </PageTransition>
    </Suspense>
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
              <EllaSidebar />
              <RANamePrompt />
              <ForcePasswordChangeGate />
              <AdFooterMobile />
              <PersistentAdSpot />
              <TermsFooterLink />
              <AdPopup trigger="onLoad" delay={2500} />
              <AdDraftPreviewOverlay />

            </AudioPlayerProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
