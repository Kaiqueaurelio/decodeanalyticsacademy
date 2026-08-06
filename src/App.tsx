/**
 * DECODE ANALYTICS ACADEMY
 * v3.48.0 - TanStack Query Integration & Performance Opt
 */
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
const TransparencyPage = lazy(() => import("./pages/TransparencyPage"));


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
      ["Implementar um sistema de monitoramento para registrar erros em tempo real e enviar alertas quando o app quebrar.", "Implementar um sistema de monitoramento para registrar erros em tempo real e enviar alertas quando o app quebrar."],
      ["Corrigir o erro de build garantindo que exista o arquivo index.html na raiz e que o Vite aponte para ele corretamente.", "Corrigir o erro de build garantindo que exista o arquivo index.html na raiz e que o Vite aponte para ele corretamente."],
      ["mude meu projeto para tanstack", "mude meu projeto para tanstack"],
      ["oque vc acha que podemos melhorar no app por gentileza ??", "oque vc acha que podemos melhorar no app por gentileza ??"],
      ["oi teste", "oi teste"],
      ["arrume os erros do app por gentielza", "arrume os erros do app por gentielza"],
      ["Adicionar logs detalhados com stack trace, navegador/OS e versionamento do build para facilitar a depuração dos erros.\nAdicionar logs detalhados com stack trace, navegador/OS e versionamento do build para facilitar a depuração dos erros.Adicionar logs detalhados com stack trace, navegador/OS e versionamento do build para facilitar a depuração dos erros.", "Adicionar logs detalhados com stack trace, navegador/OS e versionamento do build para facilitar a depuração dos erros.\nAdicionar logs detalhados com stack trace, navegador/OS e versionamento do build para facilitar a depuração dos erros.Adicionar logs detalhados com stack trace, navegador/OS e versionamento do build para facilitar a depuração dos erros."],
      ["faça meçhorias na landingpage para que ela fique nota 1000 oque acha que podemos fazeer??", "faça meçhorias na landingpage para que ela fique nota 1000 oque acha que podemos fazeer??"],
      ["deixe a landingpage mais rapida pois ela não esta renderizando as coisas rapiso por gentileza", "deixe a landingpage mais rapida pois ela não esta renderizando as coisas rapiso por gentileza"],
      ["Implementar uma página de 404/rota não encontrada protegida por login, com link para voltar para o dashboard após o usuário autenticar.", "Implementar uma página de 404/rota não encontrada protegida por login, com link para voltar para o dashboard após o usuário autenticar."],
      ["Implemente um guard global de autenticação para garantir que nenhuma rota protegida fique acessível sem sessão válida.Adicione redirecionamento automático após o login para a rota originalmente solicitada pelo usuário.Implemente uma página de 403 (acesso negado) protegida por login, exibindo instruções e um botão para redirecionar ao dashboard.Aprimore a página de 404 com uma mensagem mais amigável, botão para voltar ao dashboard e um campo de busca rápida por apostilas.", "Implemente um guard global de autenticação para garantir que nenhuma rota protegida fique acessível sem sessão válida.Adicione redirecionamento automático após o login para a rota originalmente solicitada pelo usuário.Implemente uma página de 403 (acesso negado) protegida por login, exibindo instruções e um botão para redirecionar ao dashboard.Aprimore a página de 404 com uma mensagem mais amigável, botão para voltar ao dashboard e um campo de busca rápida por apostilas."],
      ["Implemente recuperação de senha com envio de email e redefinição segura para usuários e admin.", "Implemente recuperação de senha com envio de email e redefinição segura para usuários e admin."],
      ["Crie uma página protegida para listar minhas apostilas com busca, filtros e ordenação por título e data.", "Crie uma página protegida para listar minhas apostilas com busca, filtros e ordenação por título e data."],
      ["Resolva o erro que tem apostilas do 6semetre que não aparecem para o aluno que as matérias são 📚 Disciplinas Presenciais\nSistemas Operacionais e Mobile\nCálculo Numérico Computacional (quinzenal)\nPesquisa Operacional\nAspectos Teóricos da Computação\nGestão de Projetos\nProcessamento de Imagem e Visão Computacional\n\n💻 Disciplinas AVA (EAD)\nCiência de Dados\nMétodos de Pesquisa\nInterdisciplinar de Ciência da Computação façam eles aparecer para o aluno", "Resolva o erro que tem apostilas do 6semetre que não aparecem para o aluno que as matérias são 📚 Disciplinas Presenciais\nSistemas Operacionais e Mobile\nCálculo Numérico Computacional (quinzenal)\nPesquisa Operacional\nAspectos Teóricos da Computação\nGestão de Projetos\nProcessamento de Imagem e Visão Computacional\n\n💻 Disciplinas AVA (EAD)\nCiência de Dados\nMétodos de Pesquisa\nInterdisciplinar de Ciência da Computação façam eles aparecer para o aluno"],
      ["Verifique até a apostila que eu criei hoje sobre introdução a pesquisa Operacional por gentileza", "Verifique até a apostila que eu criei hoje sobre introdução a pesquisa Operacional por gentileza"],
      ["Verifique se o app está subindo as atualizações na vercel por gentileza", "Verifique se o app está subindo as atualizações na vercel por gentileza"],
      ["Já coloque matérias e apostila nos semestres do 1 ao 4 que estão vazios por gentileza coloque tudo por gentileza deixe completo e como a nossa indentidade que já usamos", "Já coloque matérias e apostila nos semestres do 1 ao 4 que estão vazios por gentileza coloque tudo por gentileza deixe completo e como a nossa indentidade que já usamos"],
      ["Tem apostila que estão c dificuldade para ler o texto quando o texto for no estilo código sabe para copiar ele fica branco com a letra branca e não vai  e outra coisa o app não está gerando a capa da matéria com ia arrume isso por gentileza", "Tem apostila que estão c dificuldade para ler o texto quando o texto for no estilo código sabe para copiar ele fica branco com a letra branca e não vai  e outra coisa o app não está gerando a capa da matéria com ia arrume isso por gentileza"],
      ["Melhor a parte d eapostila  que esta o botão estruturar com Ella arrume deixe funcional sem erros", "Melhor a parte d eapostila  que esta o botão estruturar com Ella arrume deixe funcional sem erros"],
      ["Inclua gráficos e métricas no dashboard do aluno e admin para acompanhar desempenho por matéria, acertos/erros e evolução ao longo do tempo.", "Inclua gráficos e métricas no dashboard do aluno e admin para acompanhar desempenho por matéria, acertos/erros e evolução ao longo do tempo."],
    ]);


    const patchCopy = () => {
      document.querySelectorAll("h1,h2,h3,p,span,body,button,a").forEach((node) => {
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
  const [adminTab, setAdminTab] = React.useState<any>("overview");
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
        <Route path="/transparencia" element={<TransparencyPage />} />
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
        <Route path="/apostila/:id" element={<ProtectedRoute><ApostilaPage tab={adminTab} setTab={setAdminTab} /></ProtectedRoute>} />
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
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage tab={adminTab} setTab={setAdminTab} /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminPage tab={adminTab} setTab={setAdminTab} /></ProtectedRoute>} />
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
