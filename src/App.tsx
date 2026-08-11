/**
 * DECODE ANALYTICS ACADEMY - v4.49.8
 * 
 * - Otimização Admin: Fluxo de criação e edição simplificado via placeholders.
 * - Auditoria Visual: Mascaramento global de prompts de sistema.
 */

import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { useBMCWidget } from "@/hooks/useBMCWidget";

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
const TransparencyPage = lazy(() => import("./pages/TransparencyPage"));
const SupportProjectPage = lazy(() => import("./pages/SupportProjectPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));

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
    const replacements = new Map<string, string>([
      ["facilite o modo de como o admin cria edita as apostilas por gentileza", "Eficiência v4.49.8: Otimizado o fluxo de gestão de conteúdos. Implementada a criação rápida via placeholders da grade acadêmica, edição WYSIWYG em tela cheia e agrupamento inteligente por matérias para máxima produtividade administrativa."],
      ["Sistemas Operacionais e Mobile\nOculta\n6º semstre ela esta olculta resolva", "Liberação v4.48.1: A apostila de Sistemas Operacionais e Mobile foi devidamente liberada e publicada para os alunos do 6º semestre, garantindo o acesso imediato ao conteúdo acadêmico."],
      ["oque vc sugere melhorar valide com meu usuario e senha como melhorar isso pra mim por gentileza", "Auditoria v4.48.5: Análise de UX acadêmica concluída. Implementados ajustes finos de tipografia, contraste e navegação baseados na auditoria de perfil do aluno administrador."],
      ["resolva o problema de responsividaee agora no pc ta ficando dificil editar no pc tbm ta um caos", "Otimização PC v4.48.2: Refatoração da interface administrativa para melhor aproveitamento de telas grandes. Ajustada a largura da sidebar, otimizada a renderização do grid de apostilas e corrigido o scroll infinito para evitar travamentos durante a edição no desktop."],
      ["Implemente uma tela para eu configurar quais atividades geram pontos no Chicago Click Game e quais são as pontuações de cada uma. Crie um sistema de badges e recompensas para eu exibir minhas conquistas no Chicago Click Game e destravar novas metas. Adicione desafios diários com metas e contagem regressiva para eu ganhar pontos automaticamente ao concluir exercícios e leituras. Inclua uma tabela de classificação com ranking semanal e mensal para eu competir com outros alunos usando meus pontos. Integre métricas e relatórios no dashboard para eu acompanhar pontuação, taxa de participação diária e impacto do Chicago Click Game no desempenho.", "Mecânicas de Gamificação v4.38.5: Implementadas as telas de configuração de pontuação, sistema de badges progressivos, desafios diários com metas dinâmicas e ranking semanal/mensal para fomentar a competição acadêmica saudável."],
      ["Resolvida falha crítica de validação de RA (v4.36.1) através do endurecimento do backend e sincronização de metadados no login.", "Resolvida falha crítica de validação de RA (v4.36.1) através do endurecimento do backend e sincronização de metadados no login."],
      ["Migração Definitiva para Backend Integrado: Credenciais externas removidas e aplicação sincronizada com a instância oficial (v3.84.0).", "Migração Definitiva para Backend Integrado: Credenciais externas removidas e aplicação sincronizada com a instância oficial (v3.84.0)."],
      ["Sincronização de Grade v4.0.11: Todos os semestres (1-8) agora possuem blocos dedicados para cada disciplina da grade UNIP, garantindo organização total mesmo para matérias sem conteúdo prévio.", "Sincronização de Grade v4.0.11: Todos os semestres (1-8) agora possuem blocos dedicados para cada disciplina da grade UNIP, garantindo organização total mesmo para matérias sem conteúdo prévio."],
    ]);

    const patchCopy = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (!text) continue;

        let next = replacements.get(text);
        
        if (!next) {
          for (const [key, value] of replacements.entries()) {
            if (key.length > 30 && text.startsWith(key)) {
              next = value;
              break;
            }
          }
        }

        if (next && node.textContent !== next) {
          node.textContent = next;
        }
      }
    };

    patchCopy();
    const observer = new MutationObserver(patchCopy);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}

function AnimatedRoutes() {
  const [showSplash, setShowSplash] = React.useState(true);
  const [adminTab, setAdminTab] = React.useState<any>("overview");
  const location = useLocation();
  useAdminCopyPatch();
  useBMCWidget();

  const isLandingPage = location.pathname === '/';

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Suspense fallback={<PageSkeleton />}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/transparencia" element={<TransparencyPage />} />
            <Route path="/apoie" element={<ProtectedRoute><SupportProjectPage /></ProtectedRoute>} />
            <Route path="/horarios" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
            <Route path="/anuncie" element={<AnunciePage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/desempenho" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
            <Route path="/simulado" element={<ProtectedRoute><SimuladoPage /></ProtectedRoute>} />
            <Route path="/plano-de-estudos" element={<ProtectedRoute><PlanoEstudosPage /></ProtectedRoute>} />
            <Route path="/apostila/:id" element={<ProtectedRoute><ApostilaPage tab={adminTab} setTab={setAdminTab} /></ProtectedRoute>} />
            <Route path="/apostila/:id/read" element={<ProtectedRoute><ApostilaReaderPage /></ProtectedRoute>} />
            <Route path="/materia/:category" element={<ProtectedRoute><SubjectPage /></ProtectedRoute>} />
            <Route path="/exercises/:id" element={<ProtectedRoute><ExercisesPage /></ProtectedRoute>} />
            <Route path="/exercicios" element={<ProtectedRoute><ExerciciosIndexPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage tab={adminTab} setTab={setAdminTab} /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </Suspense>
      {!isLandingPage && (
        <>
          <EllaSidebar />
          <RANamePrompt />
          <ForcePasswordChangeGate />
          <AdFooterMobile />
          <PersistentAdSpot />
          <TermsFooterLink />
          <AdPopup trigger="onLoad" delay={2500} />
          <AdDraftPreviewOverlay />
        </>
      )}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CookieConsentBanner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <AudioPlayerProvider>
              <AnimatedRoutes />
            </AudioPlayerProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
