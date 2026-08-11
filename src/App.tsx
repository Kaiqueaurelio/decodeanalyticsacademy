import React, { Suspense, lazy, useState } from "react";
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
const NotebookPage = lazy(() => import("./pages/NotebookPage"));

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
      ["Claro. Aqui está somente em formato .md, pronto para você copiar e salvar como caderno.md:\n# Caderno Digital — Decode Analytics Academy\n## Objetivo\nCriar dentro do **Decode Analytics Academy** um sistema de **Caderno Digital**.\nA ideia é que cada disciplina seja representada como um **caderno**.\nO usuário entra na área **Cadernos**, visualiza os cadernos disponíveis e, ao clicar em um deles, entra no conteúdo daquele caderno e visualiza suas páginas.\n### Estrutura\n```text\nCadernos\n   ↓\nCaderno / Disciplina\n   ↓\nPáginas do caderno\n   ↓\nConteúdo das páginas\n⸻\n1. Tela “Meus Cadernos”\nCriar uma tela chamada:\nMeus Cadernos\nAs disciplinas devem aparecer como cards grandes, visualmente semelhantes às imagens de referência.\nCada card deve transmitir a ideia de uma capa de caderno.\nExemplo:\n┌──────────────────────────────┐\n│                              │\n│        IMAGEM / CAPA         │\n│                              │\n│  LINGUAGENS FORMAIS          │\n│  E AUTÔMATOS                 │\n│                              │\n├──────────────────────────────┤\n│ 📖 Linguagens Formais        │\n│                              │\n│ 5º semestre                  │\n│ 🟢 Em andamento              │\n│                              │\n│ ███████████░░░ 72%           │\n└──────────────────────────────┘\nCada card deve ser clicável.\nAo clicar em um card, abrir o caderno correspondente.\n⸻\n2. O card representa um caderno\nNão tratar o card apenas como um CourseCard.\nA entidade deve ser chamada de:\nNotebook\nou:\nCaderno\nCada caderno deve possuir:\ninterface Notebook {\n  id: string;\n  title: string;\n  description?: string;\n  cover?: string;\n  semester?: string;\n  status?: string;\n  progress?: number;\n  createdAt: string;\n  updatedAt: string;\n}\n⸻\n3. Abrindo o caderno\nQuando o usuário clicar, por exemplo, em:\nLinguagens Formais e Autômatos\nele deve entrar no caderno.\nA sensação deve ser de:\n“Acabei de abrir o meu caderno dessa disciplina.”\nNão quero que essa tela pareça um dashboard tradicional.\nEstrutura:\n← Meus Cadernos\n📖 Linguagens Formais e Autômatos\n5º semestre\n72% concluído\n────────────────────────────\nPÁGINAS DO CADERNO\n┌─────────────────────────────┐\n│ 📄 Objetivos Gerais         │\n│ Atualizado recentemente     │\n└─────────────────────────────┘\n┌─────────────────────────────┐\n│ 📄 Competências             │\n│ Atualizado recentemente     │\n└─────────────────────────────┘\n┌─────────────────────────────┐\n│ 📄 Introdução               │\n│ Atualizado recentemente     │\n└─────────────────────────────┘\n┌─────────────────────────────┐\n│ 📄 Autômatos Finitos        │\n│ Atualizado recentemente     │\n└─────────────────────────────┘\n        + Nova página\n⸻\n4. Páginas do caderno\nCada caderno pode possuir quantas páginas forem necessárias.\nExemplo:\nLinguagens Formais e Autômatos\n├── Objetivos Gerais\n├── Competências\n├── Introdução\n├── Linguagens Formais\n├── Autômatos Finitos\n├── Expressões Regulares\n├── Gramáticas\n├── Exercícios\n└── Anotações\nCada página deve ser clicável.\n⸻\n5. Criar uma nova página\nDentro do caderno deve existir um botão:\n+ Nova página\nAo clicar:\nNova página\nTítulo\n[________________________]\nDescrição\n[________________________]\n[ Criar página ]\nDepois de criada, a página deve aparecer automaticamente na lista do caderno.\n⸻\n6. Página do caderno\nAo clicar em uma página, abrir uma interface que represente uma folha do caderno.\nExemplo:\n← Linguagens Formais e Autômatos\n# Introdução\n────────────────────────────\nConteúdo da página...\nTexto explicativo...\nImagem...\nAnotação...\n────────────────────────────\n+ Adicionar conteúdo\nA página deve ser editável.\n⸻\n7. Conteúdo dentro das páginas\nCada página deve permitir adicionar diferentes tipos de conteúdo.\nTipos iniciais:\n📝 Texto\n🖼️ Imagem\n📄 Arquivo\n💻 Código\n🎥 Vídeo\n🔗 Link\n📌 Anotação\n📋 Checklist\n🧠 Exercício\nO usuário deve poder adicionar vários blocos na mesma página.\nExemplo:\nIntrodução\n📝 Texto\n🖼️ Imagem\n📌 Anotação\n💻 Código\n🧠 Exercício\n⸻\n8. Estrutura dos dados\nA relação deve ser:\nCaderno\n   │\n   ├── Página\n   │      │\n   │      ├── Conteúdo\n   │      ├── Conteúdo\n   │      └── Conteúdo\n   │\n   ├── Página\n   │      │\n   │      └── Conteúdo\n   │\n   └── Página\nModelo:\ninterface Notebook {\n  id: string;\n  title: string;\n  cover?: string;\n  semester?: string;\n  status?: string;\n  progress?: number;\n}\ninterface NotebookPage {\n  id: string;\n  notebookId: string;\n  title: string;\n  description?: string;\n  position: number;\n  createdAt: string;\n  updatedAt: string;\n}\ninterface PageContent {\n  id: string;\n  pageId: string;\n  type: string;\n  content: unknown;\n  position: number;\n  createdAt: string;\n  updatedAt: string;\n}\n⸻\n9. Funcionalidades do Caderno\nCadernos\nO usuário deve conseguir:\n* visualizar cadernos;\n* abrir cadernos;\n* visualizar capa;\n* visualizar progresso;\n* visualizar semestre.\nPáginas\nO usuário deve conseguir:\n* criar páginas;\n* editar páginas;\n* excluir páginas;\n* duplicar páginas;\n* reorganizar páginas;\n* pesquisar páginas.\nConteúdo\nO usuário deve conseguir:\n* adicionar conteúdo;\n* editar conteúdo;\n* excluir conteúdo;\n* reorganizar conteúdo;\n* salvar conteúdo.\nOs dados devem permanecer salvos quando o usuário sair e voltar para o caderno.\n⸻\n10. Visual\nUsar as imagens fornecidas como referência de estrutura, organization e experiência visual.\nQuero principalmente:\n* aparência de caderno digital;\n* cards como capas de cadernos;\n* páginas organizadas;\n* hierarquia visual clara;\n* bastante espaço em branco;\n* cards elegantes;\n* navegação simples;\n* sensação de estar “abrindo um caderno”.\nNão copiar:\n* logos;\n* nomes;\n* textos;\n* identidade visual;\n* elementos proprietários das referências.\nA identidade deve ser própria do:\nDecode Analytics Academy\n⸻\n11. Regra principal\nO conceito mais importante é:\nCada disciplina é um caderno.\nE:\nCada caderno possui várias páginas.\nE:\nCada página pode possuir vários conteúdos.\nA experiência final deve ser:\n📚 Meus Cadernos\n    ↓\n📖 Linguagens Formais e Autômatos\n    ↓\n📄 Objetivos Gerais\n📄 Introdução\n📄 Autômatos Finitos\n📄 Expressões Regulares\n📄 Exercícios\n    ↓\n📄 Introdução\n    ↓\n📝 Texto\n🖼️ Imagem\n💻 Código\n🧠 Exercício\n📌 Anotação\nResultado esperado\nQuero um sistema de caderno funcional, e não apenas uma tela bonita.\nO usuário deve conseguir:\n1. Abrir um caderno.\n2. Visualizar suas páginas.\n3. Criar novas páginas.\n4. Abrir uma página.\n5. Adicionar conteúdos.\n6. Editar conteúdos.\n7. Reorganizar conteúdos.\n8. Salvar tudo.\n9. Sair do sistema.\n10. Voltar posteriormente e encontrar o caderno exatamente como deixou.\nPrioridade: implementar primeiro a estrutura funcional:\nCaderno → Páginas → Conteúdo\nDepois aprimorar animações, microinterações e detalhes visuais.\n\nAntes de executar qualquer ação, faça de 2 a 5 perguntas INTERATIVAS para entender melhor o que eu quero (alvo, valores, escopo) — não digite o texto das perguntas na sua resposta; quero elas interativas, para eu marcar ou responder direto na caixa de perguntas. Não implemente nada até eu responder. Se o pedido já estiver totalmente especificado (alvo + valor + escopo), aí sim execute direto.", "Arquitetura v4.55.0: Implementado o sistema de Caderno Digital integrado à grade acadêmica. Cada disciplina agora funciona como um caderno pessoal, permitindo que alunos criem páginas com blocos de texto, anotações e código, com persistência total no banco de dados."],
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

const BMCWidgetLoader = () => {
  useBMCWidget();
  return null;
};

const App = () => {
  useAdminCopyPatch();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AudioPlayerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
                <BMCWidgetLoader />
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
                      <Route path="/caderno/:notebookId" element={<PageTransition><NotebookPage /></PageTransition>} />
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
                      <Route path="/admin" element={<ProtectedRoute adminOnly><PageTransition><AdminPage /></PageTransition></ProtectedRoute>} />
                      <Route path="/admin/biblioteca" element={<ProtectedRoute adminOnly><PageTransition><AdminBibliotecaPage /></PageTransition></ProtectedRoute>} />
                      <Route path="/admin/apostilas/:id" element={<ProtectedRoute adminOnly><PageTransition><AdminApostilaWorkbench /></PageTransition></ProtectedRoute>} />
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
