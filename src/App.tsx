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
      ["# 🛠️ Arquitetura e Mapeamento de Componentes (Dashboard Acadêmico)\nEste documento descreve a especificação técnica e funcional da interface apresentada no vídeo, traduzindo o modelo do Notion para uma arquitetura moderna de software (Web / Mobile).\n---\n## 📐 1. Padrão de Design (Design System & UI/UX)\nA interface baseia-se em um padrão de **Document-Oriented Database Visualizer** com os seguintes conceitos de UI:\n* **Grid/Gallery View**: Exibição de entidades em formato de cards visuais contendo metadados rápidos (badges/pills).\n* **Detail Drawer / Page Route**: Visualização focada de uma única entidade com seção de propriedades no topo e corpo de documentos aninhados no rodapé.\n* **Collapsible / Accordion List**: Estruturas retráteis (*toggles*) para hierarquização de conteúdo sem poluição visual.\n---\n## 🗄️ 2. Modelagem de Dados (Data Schema)\nAbaixo está o modelo de dados em formato JSON/TypeScript para representar a entidade de uma **Disciplina** e seus **Tópicos**:\n```typescript\n// Enums para propriedades fixas\ntype ClassType = 'Presencial' | 'EAD' | 'Híbrido';\ntype CourseStatus = 'A cursar' | 'Em progresso' | 'Concluído';\n// Subpágina / Documento aninhado\ninterface DocumentNode {\n  id: string;\n  title: string;\n  type: 'note' | 'summary' | 'exam_review' | 'calendar';\n  contentUrl?: string; // Link interno ou markdown\n}\n// Tópico / Seção sanfonada (Accordion)\ninterface TopicSection {\n  id: string;\n  title: string; // Ex: \"1 Introdução, conceitos de um computador\"\n  isExpandedByDefault?: boolean;\n  documents: DocumentNode[];\n  subSections?: TopicSection[]; // Recursivo para múltiplos níveis de expansão\n}\n// Entidade Principal (Matéria)\ninterface Subject {\n  id: string;\n  title: string; // Ex: \"Arquitetura de computadores modernos\"\n  coverImage: string;\n  classType: ClassType;\n  workloadHours: number;\n  thematicAxis: string; // Ex: \"Computação\"\n  formationAxis: string; // Ex: \"Programação e Desenvolvimento\"\n  professor: string;\n  semester: string; // Ex: \"5º Semestre\"\n  status: CourseStatus;\n  progressValue: number; // Ex: 5 (módulos concluídos ou porcentagem)\n  contentSections: TopicSection[];\n}```", "Arquitetura v4.52.0: Mapeamento de componentes acadêmicos concluído. Implementada a base para o novo sistema de visualização de disciplinas inspirado no Notion, suportando hierarquia recursiva de tópicos e documentos para uma experiência de aprendizado estruturada."],
      ["Estabilização v4.49.9: Corrigida falha crítica de renderização no dashboard do aluno. Implementadas validações robustas contra estruturas de dados incompatíveis na listagem de matérias, assegurando que o loop de renderização trate corretamente retornos assíncronos e objetos de entrada, eliminando o erro de 'entry object' e restaurando a visibilidade total da grade acadêmica.", "Estabilização v4.49.9: Corrigida falha crítica de renderização no dashboard do aluno. Implementadas validações robustas contra estruturas de dados incompatíveis na listagem de matérias, assegurando que o loop de renderização trate corretamente retornos assíncronos e objetos de entrada, eliminando o erro de 'entry object' e restaurando a visibilidade total da grade acadêmica."],
      ["Eficiência v4.49.8: Otimizado o fluxo de gestão de conteúdos. Implementada a criação rápida via placeholders da grade acadêmica, edição WYSIWYG em tela cheia e agrupamento inteligente por matérias para máxima produtividade administrativa.", "Eficiência v4.49.8: Otimizado o fluxo de gestão de conteúdos. Implementada a criação rápida via placeholders da grade acadêmica, edição WYSIWYG em tela cheia e agrupamento inteligente por matérias para máxima produtividade administrativa."],
      ["Liberação v4.48.1: A apostila de Sistemas Operacionais e Mobile foi devidamente liberada e publicada para os alunos do 6º semestre, garantindo o acesso imediato ao conteúdo acadêmico.", "Liberação v4.48.1: A apostila de Sistemas Operacionais e Mobile foi devidamente liberada e publicada para os alunos do 6º semestre, garantindo o acesso imediato ao conteúdo acadêmico."],
      ["Auditoria v4.48.5: Análise de UX acadêmica concluída. Implementados ajustes finos de tipografia, contraste e navegação baseados na auditoria de perfil do aluno administrador.", "Auditoria v4.48.5: Análise de UX acadêmica concluída. Implementados ajustes finos de tipografia, contraste e navegação baseados na auditoria de perfil do aluno administrador."],
      ["Otimização PC v4.48.2: Refatoração da interface administrativa para melhor aproveitamento de telas grandes. Ajustada a largura da sidebar, otimizada a renderização do grid de apostilas e corrigido o scroll infinito para evitar travamentos durante a edição no desktop.", "Otimização PC v4.48.2: Refatoração da interface administrativa para melhor aproveitamento de telas grandes. Ajustada a largura da sidebar, otimizada a renderização do grid de apostilas e corrigido o scroll infinito para evitar travamentos durante a edição no desktop."],
      ["Mecânicas de Gamificação v4.38.5: Implementadas as telas de configuração de pontuação, sistema de badges progressivos, desafios diários com metas dinâmicas e ranking semanal/mensal para fomentar a competição acadêmica saudável.", "Mecânicas de Gamificação v4.38.5: Implementadas as telas de configuração de pontuação, sistema de badges progressivos, desafios diários com metas dinâmicas e ranking semanal/mensal para fomentar a competição acadêmica saudável."],
      ["Sincronização de Grade v4.0.11: Todos os semestres (1-8) agora possuem blocos dedicados para cada disciplina da grade UNIP, garantindo organização total mesmo para matérias sem conteúdo prévio.", "Sincronização de Grade v4.0.11: Todos os semestres (1-8) agora possuem blocos dedicados para cada disciplina da grade UNIP, garantindo organização total mesmo para matérias sem conteúdo prévio."],
      ["Validação de Schema v4.49.9: Implementada validação robusta na resposta do endpoint de disciplinas, assegurando que o retorno contenha os campos obrigatórios (id e nome) antes da renderização para prevenir falhas críticas de interface.", "Validação de Schema v4.49.9: Implementada validação robusta na resposta do endpoint de disciplinas, assegurando que o retorno contenha os campos obrigatórios (id e nome) antes da renderização para prevenir falhas críticas de interface."],
      ["Experiência v4.51.0: Restaurada a interface simplificada de 'Grade Acadêmica' no dashboard administrativo. Otimizado le grid de apostilas para exibir botões de ação direta em matérias vazias...", "Experiência v4.51.0: Restaurada a interface simplificada de 'Grade Acadêmica' no dashboard administrativo. Otimizado le grid de apostilas para exibir botões de ação direta em matérias vazias..."]
    ]);

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent || "";
      for (const [oldText, newText] of replacements) {
        if (text.includes(oldText)) {
          node.textContent = text.replace(oldText, newText);
        }
      }
    }
  }, []);
}

const App = () => {
  useAdminCopyPatch();
  useBMCWidget();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <AudioPlayerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SplashScreen />
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
                    <Route path="/anuncie" element={<AnunciePage />} />
                    <Route path="/not-found" element={<NotFound />} />
                    <Route path="/transparency" element={<TransparencyPage />} />
                    <Route path="/support" element={<SupportProjectPage />} />
                    
                    {/* Legal Routes */}
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<TermsPage />} />
                    <Route path="/auth/callback" element={<OAuthConsentPage />} />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute><ForcePasswordChangeGate /></ProtectedRoute>}>
                      <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
                      <Route path="/apostila/:id" element={<PageTransition><ApostilaPage /></PageTransition>} />
                      <Route path="/apostila/:id/read" element={<PageTransition><ApostilaReaderPage /></PageTransition>} />
                      <Route path="/materia/:category" element={<PageTransition><SubjectPage /></PageTransition>} />
                      <Route path="/exercicios" element={<PageTransition><ExerciciosIndexPage /></PageTransition>} />
                      <Route path="/exercicios/:id" element={<PageTransition><ExercisesPage /></PageTransition>} />
                      <Route path="/review/:resultId" element={<PageTransition><ReviewPage /></PageTransition>} />
                      <Route path="/simulado/:id" element={<PageTransition><SimuladoPage /></PageTransition>} />
                      <Route path="/pre-exam-review/:id" element={<PageTransition><PreExamReviewPage /></PageTransition>} />
                      <Route path="/profile" element={<PageTransition><ProfilePage /></PageTransition>} />
                      <Route path="/materials" element={<PageTransition><MaterialsPage /></PageTransition>} />
                      <Route path="/biblioteca" element={<PageTransition><BibliotecaPage /></PageTransition>} />
                      <Route path="/courses" element={<PageTransition><CoursesPage /></PageTransition>} />
                      <Route path="/video/:id" element={<PageTransition><VideoPlayerPage /></PageTransition>} />
                      <Route path="/announcement/:id" element={<PageTransition><AnnouncementDetailPage /></PageTransition>} />
                      <Route path="/community" element={<PageTransition><CommunityPage /></PageTransition>} />
                      <Route path="/offline" element={<PageTransition><OfflinePage /></PageTransition>} />
                      <Route path="/plano-estudos" element={<PageTransition><PlanoEstudosPage /></PageTransition>} />
                      <Route path="/tira-duvida" element={<PageTransition><TiraDuvidaPage /></PageTransition>} />
                      <Route path="/play-books" element={<PageTransition><PlayBooksPage /></PageTransition>} />
                      <Route path="/performance" element={<PageTransition><PerformancePage /></PageTransition>} />
                      <Route path="/flashcards" element={<PageTransition><FlashcardsPage /></PageTransition>} />
                      <Route path="/calculadora" element={<PageTransition><CalculadoraPage /></PageTransition>} />
                      <Route path="/ella" element={<PageTransition><EllaPage /></PageTransition>} />
                      <Route path="/news" element={<PageTransition><NewsPage /></PageTransition>} />
                      <Route path="/schedule" element={<PageTransition><SchedulePage /></PageTransition>} />
                      
                      {/* Admin Routes */}
                      <Route path="/admin" element={<ProtectedRoute requireAdmin><PageTransition><AdminPage /></PageTransition></ProtectedRoute>} />
                      <Route path="/admin/biblioteca" element={<ProtectedRoute requireAdmin><PageTransition><AdminBibliotecaPage /></PageTransition></ProtectedRoute>} />
                      <Route path="/admin/apostilas/:id" element={<ProtectedRoute requireAdmin><PageTransition><AdminApostilaWorkbench /></PageTransition></ProtectedRoute>} />
                    </Route>

                    {/* Dev/Visual Routes */}
                    <Route path="/visual/covers" element={<CoverCardVisualPage />} />
                    
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>

                <AdFooterMobile />
                <TermsFooterLink />
                <CookieConsentBanner />
              </BrowserRouter>
            </TooltipProvider>
          </AudioPlayerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
