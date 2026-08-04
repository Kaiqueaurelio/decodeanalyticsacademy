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
      ["TanStack app previews are currently unavailable\narrume isso", "TanStack app previews are currently unavailable\narrume isso"],
      ["mude meu projeto para tanstack", "mude meu projeto para tanstack"],
      ["oque vc acha que podemos melhorar no app por gentileza ??", "oque vc acha que podemos melhorar no app por gentileza ??"],
      ["Analise completamente todo o projeto antes de realizar qualquer alteraÃ§Ã£o.\n\nQuero que vocÃª faÃ§a uma otimizaÃ§Ã£o profunda em toda a aplicaÃ§Ã£o com foco total em performance, fluidez de navegaÃ§Ã£o, velocidade de carregamento e experiÃªncia do usuÃ¡rio.\n\nTransformar o sistema em uma aplicaÃ§Ã£o extremamente rÃ¡pida, leve, fluida e responsiva.\n\nAnalise:\n- Estrutura do projeto, rotas, componentes, hooks\n- Estados globais, queries, integraÃ§Ãµes com Supabase\n- Chamadas API, renderizaÃ§Ãµes desnecessÃ¡rias\n- Bundle size, assets, imagens, CSS, scripts\n- Consumo de memÃ³ria, gargalos de performance\n- Problemas de carregamento, hidrataÃ§Ã£o, reatividade\n\nOtimize:\n- FRONTEND: Lazy loading, code splitting, memoizaÃ§Ã£o, re-renderizaÃ§Ãµes, imports desnecessÃ¡rios, cache, prefetch, Suspense/loading states\n- NAVEGAÃ‡ÃƒO: TransiÃ§Ãµes fluidas entre pÃ¡ginas, reduzir delays, evitar piscadas visuais\n- SUPABASE/BACKEND: Otimizar queries, reduzir requests desnecessÃ¡rios, melhorar paginaÃ§Ã£o, realtime, cache\n- IMAGENS/ASSETS: CompressÃ£o, lazy loading, formatos otimizados\n- CSS/UI: Remover CSS redundante, otimizar animaÃ§Ãµes, melhorar fluidez\n- AVANÃ‡ADO: Core Web Vitals, Lighthouse, FPS, memory leaks, tempo de interaÃ§Ã£o\n\nRegras: NÃƒO quebrar funcionalidades, NÃƒO remover recursos, NÃƒO alterar design sem necessidade. O resultado deve ser uma aplicaÃ§Ã£o muito mais rÃ¡pida, fluida, leve e otimizada para produÃ§Ã£o.", "Analise completamente todo o projeto antes de realizar qualquer alteraÃ§Ã£o.\n\nQuero que vocÃª faÃ§a uma otimizaÃ§Ã£o profunda em toda a aplicaÃ§Ã£o com foco total em performance, fluidez de navegaÃ§Ã£o, velocidade de carregamento e experiÃªncia do usuÃ¡rio.\n\nTransformar o sistema em uma aplicaÃ§Ã£o extremamente rÃ¡pida, leve, fluida e responsiva.\n\nAnalise:\n- Estrutura do projeto, rotas, componentes, hooks\n- Estados globais, queries, integraÃ§Ãµes com Supabase\n- Chamadas API, renderizaÃ§Ãµes desnecessÃ¡rias\n- Bundle size, assets, imagens, CSS, scripts\n- Consumo de memÃ³ria, gargalos de performance\n- Problemas de carregamento, hidrataÃ§Ã£o, reatividade\n\nOtimize:\n- FRONTEND: Lazy loading, code splitting, memoizaÃ§Ã£o, re-renderizaÃ§Ãµes, imports desnecessÃ¡rios, cache, prefetch, Suspense/loading states\n- NAVEGAÃ‡ÃƒO: TransiÃ§Ãµes fluidas entre pÃ¡ginas, reduzir delays, evitar piscadas visuais\n- SUPABASE/BACKEND: Otimizar queries, reduzir requests desnecessÃ¡rios, melhorar paginaÃ§Ã£o, realtime, cache\n- IMAGENS/ASSETS: CompressÃ£o, lazy loading, formatos otimizados\n- CSS/UI: Remover CSS redundante, otimizar animaÃ§Ãµes, melhorar fluidez\n- AVANÃ‡ADO: Core Web Vitals, Lighthouse, FPS, memory leaks, tempo de interaÃ§Ã£o\n\nRegras: NÃƒO quebrar funcionalidades, NÃƒO remover recursos, NÃƒO alterar design sem necessidade. O resultado deve ser uma aplicaÃ§Ã£o muito mais rÃ¡pida, fluida, leve e otimizada para produÃ§Ã£o."],
      ["Analise completamente todo o projeto e identifique TODOS os bugs, erros, falhas, comportamentos inesperados e possÃ­veis problemas existentes na aplicaÃ§Ã£o.\n\nSeu objetivo Ã© realizar uma auditoria tÃ©cnica profunda no sistema inteiro, corrigindo problemas de lÃ³gica, frontend, backend, integraÃ§Ã£o, renderizaÃ§Ã£o, estado, banco de dados, responsividade e performance.\n\nAntes de modificar qualquer coisa:\n- Analise toda a estrutura do projeto\n- Analise rotas, componentes, hooks, estados globais\n- Analise integraÃ§Ãµes, Supabase, APIs, banco de dados\n- Analise autenticaÃ§Ã£o, permissÃµes, carregamentos\n- Analise console errors, warnings, logs\n- Analise comportamento da interface, responsividade\n- Analise possÃ­veis falhas silenciosas, seguranÃ§a bÃ¡sica\n- Analise fluxos completos do sistema\n\nIdentifique e corrija:\n- Bugs visuais e de navegaÃ§Ã£o\n- Erros de console e warnings\n- Loops infinitos, problemas de renderizaÃ§Ã£o\n- Re-renderizaÃ§Ãµes desnecessÃ¡rias\n- Falhas de autenticaÃ§Ã£o, sessÃ£o, permissÃµes\n- Problemas de loading, estado, sincronizaÃ§Ã£o\n- Problemas de responsividade, formulÃ¡rios, validaÃ§Ã£o\n- Problemas em chamadas API e queries Supabase\n- Problemas de realtime, cache, tipagem, imports\n- Problemas de performance, UX, mobile, acessibilidade\n- Memory leaks, requests duplicados, condiÃ§Ãµes de corrida\n- Falhas silenciosas, tratamento incorreto de erros\n\nVerifique especialmente:\n- Fluxos de login/logout e persistÃªncia de sessÃ£o\n- ProteÃ§Ã£o de rotas e navegaÃ§Ã£o entre pÃ¡ginas\n- CRUDs completos, uploads, modais\n- Estados assÃ­ncronos, atualizaÃ§Ãµes em tempo real\n- Compatibilidade mobile e responsividade geral\n- Componentes reutilizÃ¡veis, integraÃ§Ãµes externas\n\nRegras importantes:\n- NÃƒO remover funcionalidades sem necessidade\n- NÃƒO alterar design sem motivo\n- NÃƒO criar soluÃ§Ãµes temporÃ¡rias\n- Sempre aplicar soluÃ§Ãµes profissionais\n- Priorizar estabilidade, seguranÃ§a e confiabilidade\n- Garantir cÃ³digo limpo e sustentÃ¡vel\n\nO resultado final deve deixar a aplicaÃ§Ã£o estÃ¡vel, confiÃ¡vel, sem erros visÃ­veis, fluida, responsiva e pronta para produÃ§Ã£o.", "Analise completamente todo o projeto e identifique TODOS os bugs, erros, falhas, comportamentos inesperados e possÃ­veis problemas existentes na aplicaÃ§Ã£o.\n\nSeu objetivo Ã© realizar uma auditoria tÃ©cnica profunda no sistema inteiro, corrigindo problemas de lÃ³gica, frontend, backend, integraÃ§Ã£o, renderizaÃ§Ã£o, estado, banco de dados, responsividade e performance.\n\nAntes de modificar qualquer coisa:\n- Analise toda a estrutura do projeto\n- Analise rotas, componentes, hooks, estados globais\n- Analise integraÃ§Ãµes, Supabase, APIs, banco de dados\n- Analise autenticaÃ§Ã£o, permissÃµes, carregamentos\n- Analise console errors, warnings, logs\n- Analise comportamento da interface, responsividade\n- Analise possÃ­veis falhas silenciosas, seguranÃ§a bÃ¡sica\n- Analise fluxos completos do sistema\n\nIdentifique e corrija:\n- Bugs visuais e de navegaÃ§Ã£o\n- Erros de console e warnings\n- Loops infinitos, problemas de renderizaÃ§Ã£o\n- Re-renderizaÃ§Ãµes desnecessÃ¡rias\n- Falhas de autenticaÃ§Ã£o, sessÃ£o, permissÃµes\n- Problemas de loading, estado, sincronizaÃ§Ã£o\n- Problemas de responsividade, formulÃ¡rios, validaÃ§Ã£o\n- Problemas em chamadas API e queries Supabase\n- Problemas de realtime, cache, tipagem, imports\n- Problemas de performance, UX, mobile, acessibilidade\n- Memory leaks, requests duplicados, condiÃ§Ãµes de corrida\n- Falhas silenciosas, tratamento incorreto de erros\n\nVerifique especialmente:\n- Fluxos de login/logout e persistÃªncia de sessÃ£o\n- ProteÃ§Ã£o de rotas e navegaÃ§Ã£o entre pÃ¡ginas\n- CRUDs completos, uploads, modais\n- Estados assÃ­ncronos, atualizaÃ§Ãµes em tempo real\n- Compatibilidade mobile e responsividade geral\n- Componentes reutilizÃ¡veis, integraÃ§Ãµes externas\n\nRegras importantes:\n- NÃƒO remover funcionalidades sem necessidade\n- NÃƒO alterar design sem motivo\n- NÃƒO criar soluÃ§Ãµes temporÃ¡rias\n- Sempre aplicar soluÃ§Ãµes profissionais\n- Priorizar estabilidade, seguranÃ§a e confiabilidade\n- Garantir cÃ³digo limpo e sustentÃ¡vel\n\nO resultado final deve deixar a aplicaÃ§Ã£o estÃ¡vel, confiÃ¡vel, sem erros visÃ­veis, fluida, responsiva e pronta para produÃ§Ã£o."],
      ["Bora lá. Baseada na minha grade curricular, que você já tem, eu quero fazer o seguinte: por gentileza, eu querooo que você crie os cards das matérias do semestre, só que ao invés de você colocar texto, você deixe os cards de cada matéria do semestre em branco pra que eu possa adicionar o conteúdo deles durante o semestre, por gentileza. Você acha que a gente consegue fazer isso sem erro????", "Bora lá. Baseada na minha grade curricular, que você já tem, eu quero fazer o seguinte: por gentileza, eu querooo que você crie os cards das matérias do semestre, só que ao invés de você colocar texto, você deixe os cards de cada matéria do semestre em branco pra que eu possa adicionar o conteúdo deles durante o semestre, por gentileza. Você acha que a gente consegue fazer isso sem erro????"],
      ["Tá, vamo lá. Faça o seguinte: dê opção de o administrador colocar para os alunos quais apostilas eles querem-- que eles podem ver. Porque o que eu pedi pra você, cê não conseguiu fazer, não deu certo, que eraaa mostrar as disciplinas somente do semestre vigente, por exemplo, é o sexta. Mas eu queria que os alunos conseguissem ver todas as apostilas que eles quisessem pra poder estudar. Só que aí eu queria que você fizesse o seguinte: uma forma de ficar mais fácil dos alunos conseguir ver, achar as apostilas. Aí eu queria separar por semestre como esta na imagem  dai quando o usuario clicar no filtro ele so mostre o filtro do semestre que ele escolheu por gentileza", "Tá, vamo lá. Faça o seguinte: dê opção de o administrador colocar para os alunos quais apostilas eles querem-- que eles podem ver. Porque o que eu pedi pra você, cê não conseguiu fazer, não deu certo, que eraaa mostrar as disciplinas somente do semestre vigente, por exemplo, é o sexta. Mas eu queria que os alunos conseguissem ver todas as apostilas que eles quisessem pra poder estudar. Só que aí eu queria que você fizesse o seguinte: uma forma de ficar mais fácil dos alunos conseguir ver, achar as apostilas. Aí eu queria separar por semestre como esta na imagem  dai quando o usuario clicar no filtro ele so mostre o filtro do semestre que ele escolheu por gentileza"],
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
