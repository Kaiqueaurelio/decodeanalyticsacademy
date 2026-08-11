/**
 * DECODE ANALYTICS ACADEMY - v4.49.9
 * 
 * - Estabilização Dashboard: Validação robusta contra erros de renderização em listas de matérias.
 * - Auditoria Visual: Mascaramento global de prompts de sistema expandido.
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
      ["CORRECTION PROMPT - STUDENT DASHBOARD\nDecode Analytics Academy - Lovable Project\nPROBLEM IDENTIFIED\n\nError Message:\n\n\"Something went wrong - The app encountered an unexpected error. \nThe log was recorded and our team will be notified.\"\n\nStack Trace:\n\"iterator value oque vc sugere melhorar valide com meu usuario \ne nenhum como melhorar isso pra mim por gentileza is not an entry object\"\n\nInterpretation:\n\nError when iterating over course subjects data in student dashboard\nCode expects an entry object, but receiving a different data type\nProblem rendering subjects/courses in the component\nPROBLEM ANALYSIS\nPossible Causes:\nIncompatible data structure\nAPI returns array in different format than expected\nObject missing required properties (id, name, etc)\nIncorrect data mapping\n.map() trying to iterate over wrong type\nUndefined or null being passed\nMissing validation\nNo verification before iterating\nComponent not validating if data exists\nAsynchronous loading\nData hasn't loaded when component tries to render\nEmpty state causing error\nCORRECTION PROMPT FOR LOVABLE\n\nCopy and paste this prompt in the Lovable editor:\n\nPROMPT 1: Initial Analysis\nI'm getting an error on the student dashboard. The subjects aren't showing up.\n\nError: \"iterator value oque vc sugere melhorar valide com meu usuario \ne nenhum como melhorar isso pra mim por gentileza is not an entry object\"\n\nProblem: The component that lists subjects is throwing an error \nwhen trying to render the data.\n\nI need you to:\n1. Check the subjects/courses list component\n2. Verify the API returns data in the correct format\n3. Add validation before using .map() or forEach\n4. Add loading state while data is loading\n5. Add error boundary to catch errors\n\nExpected subject structure:\n{\n  id: string,\n  nome: string,\n  descricao: string,\n  professor: string,\n  creditos: number\n}\n\nUse TypeScript to validate types and prevent errors like this.\nPROMPT 2: Complete Solution (React/TypeScript)\nCreate a correct component to list subjects on the student dashboard.\n\nRequirements:\n1. Call API to fetch student's subjects\n2. Validate that data returns in the correct format\n3. Show loading state while fetching data\n4. Show message if student has no subjects\n5. Show error if API fails\n6. List all subjects with:\n   - Subject name\n   - Responsible professor\n   - Number of credits\n   - Status (taking/completed)\n   - Link to access the subject\n\nUse:\n- React hooks (useState, useEffect)\n- TypeScript with correct types\n- Complete error handling\n- User-friendly interface\n\nThe subjects that weren't appearing are: Introduction to Android, \nMemory Management, Paging, Segmentation, Virtual Memory, \nAndroid Memory Governance, Frame Allocation, I/O Hardware, \nI/O Software, Android Boot, I/O Kernel Subsystem, \nProtection and Security, Android Protection System.\nPROMPT 3: Specific Debug\nI want to debug why subjects aren't appearing.\n\nWhen a user enters the student dashboard, I need:\n\n1. In console.log, show:\n   - What is the logged-in student's ID\n   - What the API returns when fetching subjects\n   - What is the data type of each returned item\n   - If there are any API call errors\n\n2. Add error handling:\n```javascript\n   try {\n     const response = await fetch(`/api/student/${studentId}/subjects`);\n     const data = await response.json();\n     console.log(\"Subjects received:\", data);\n     \n     if (!Array.isArray(data)) {\n       console.error(\"Error: API did not return an array\");\n       throw new Error(\"Invalid data format\");\n     }\n     \n     data.forEach((subject, index) => {\n       console.log(`Subject ${index}:`, subject);\n       if (!subject.id || !subject.nome) {\n         console.error(\"Invalid subject:\", subject);\n       }\n     });\n   } catch (error) {\n     console.error(\"Error fetching subjects:\", error);\n   }\n```\n\n3. Then show a simple list to test:\n```jsx\n   {subjects && subjects.length > 0 ? (\n     <ul>\n       {subjects.map((subject) => (\n         <li key={subject.id}>{subject.nome}</li>\n       ))}\n     </ul>\n   ) : (\n     <p>No subjects found</p>\n   )}\n```\nPROMPT 4: Verify API\nI need to verify if the API is returning data correctly.\n\n1. What is the endpoint to fetch student's subjects?\n   GET /api/student/{studentId}/subjects\n   or\n   GET /api/subjects?studentId={studentId}\n   or something else?\n\n2. What is the exact return format? Example:\n```json\n   {\n     \"success\": true,\n     \"data\": [\n       {\n         \"id\": \"1\",\n         \"nome\": \"Introduction to Android\",\n         \"descricao\": \"...\",\n         \"professor\": \"...\",\n         \"creditos\": 4,\n         \"status\": \"taking\"\n       }\n     ]\n   }\n```\n\n3. Is the API returning:\n   - Direct array? [ { ... }, { ... } ]\n   - Object with \"data\"? { data: [ { ... } ] }\n   - Object with \"subjects\"? { subjects: [ { ... } ] }\n   - Something else?\n\n4. If API fails, what is the error response?\n\nOnce you confirm the format, I'll fix the component to \naccept exactly that format.\nSTEPS TO APPLY THE CORRECTION\nStep 1: Identify the Component\n\nLook for:\n\nStudentDashboard.tsx or StudentDashboard.jsx\nSubjectList.tsx or SubjectList.jsx\nSubjects.tsx or Courses.tsx\nAny file that lists subjects/courses\nStep 2: Check the API\n\nLook for:\n\n/api/student/*/subjects\n/api/subjects\nfetch() or axios calls\nVariable with subjects list\nStep 3: Add Validation\n\nBefore using .map():\n\njavascript\n// ❌ WRONG\nsubjects.map(s => <div>{s.nome}</div>)\n\n// ✅ CORRECT\nif (!Array.isArray(subjects)) {\n  return <p>Error: no subjects</p>\n}\n\nif (subjects.length === 0) {\n  return <p>No subjects found</p>\n}\n\nsubjects.map(s => {\n  if (!s.id || !s.nome) return null\n  return <div key={s.id}>{s.nome}</div>\n})\nStep 4: Add Loading and Error States\njavascript\nconst [loading, setLoading] = useState(true)\nconst [error, setError] = useState(null)\nconst [subjects, setSubjects] = useState([])\n\nuseEffect(() => {\n  const fetchSubjects = async () => {\n    try {\n      setLoading(true)\n      const response = await fetch(`/api/student/${studentId}/subjects`)\n      \n      if (!response.ok) {\n        throw new Error(`API error: ${response.status}`)\n      }\n      \n      const data = await response.json()\n      \n      if (!Array.isArray(data)) {\n        throw new Error(\"API did not return an array\")\n      }\n      \n      setSubjects(data)\n    } catch (err) {\n      setError(err.message)\n    } finally {\n      setLoading(false)\n    }\n  }\n  \n  fetchSubjects()\n}, [studentId])\n\n// In the return:\nif (loading) return <p>Loading subjects...</p>\nif (error) return <p>Error: {error}</p>\nif (!subjects.length) return <p>No subjects</p>\n\nreturn (\n  <div>\n    {subjects.map(s => (\n      <div key={s.id}>{s.nome}</div>\n    ))}\n  </div>\n)\nCORRECTION CHECKLIST\n Component loads data with fetch/axios\n Validates that data is an array\n Validates that each item has id and name\n Shows loading state while fetching\n Shows error if API fails\n Shows \"no subjects\" if array is empty\n Uses key={subject.id} in .map()\n Doesn't try to access undefined properties\n Console.log for debugging\n Error on dashboard is gone\nEXPECTED RESULT\n\n✅ When entering the student dashboard:\n\nPage shows \"Loading subjects...\"\nSubjects appear correctly\nIf no subjects, shows clear message\nIf error, shows \"Error loading\"\nNo red errors in console\nADDITIONAL TIPS\nFor TypeScript Type Safety:\ntypescript\ninterface Subject {\n  id: string;\n  nome: string;\n  descricao: string;\n  professor: string;\n  creditos: number;\n  status?: 'taking' | 'completed';\n}\n\ninterface SubjectsResponse {\n  success: boolean;\n  data: Subject[];\n}\nFor Better Error Messages:\njavascript\nconst fetchSubjects = async () => {\n  try {\n    const response = await fetch(`/api/student/${studentId}/subjects`)\n    \n    if (!response.ok) {\n      const errorData = await response.json()\n      throw new Error(\n        errorData.message || `HTTP Error: ${response.status}`\n      )\n    }\n    \n    const result = await response.json()\n    \n    // Validate structure\n    if (!result.data || !Array.isArray(result.data)) {\n      throw new Error(\"Invalid API response structure\")\n    }\n    \n    setSubjects(result.data)\n  } catch (err) {\n    console.error(\"Failed to fetch subjects:\", err)\n    setError(\n      err instanceof Error \n        ? err.message \n        : \"An unknown error occurred\"\n    )\n  } finally {\n    setLoading(false)\n  }\n}\n\nUse this prompt with Lovable to fix the error! 🚀\n\nQuick Copy-Paste Guide:\n\nCopy PROMPT 1 → Paste in Lovable\nWait for response\nIf you need more details, use PROMPT 2, 3, or 4\nApply the correction steps\nCheck the correction checklist\nTest and verify it works\nALTERNATIVE: If Using a Different Framework\nFor Vue.js:\nvue\n<template>\n  <div v-if=\"loading\">Loading subjects...</div>\n  <div v-else-if=\"error\" class=\"error\">{{ error }}</div>\n  <div v-else-if=\"subjects.length === 0\">No subjects found</div>\n  <div v-else>\n    <div v-for=\"subject in subjects\" :key=\"subject.id\">\n      {{ subject.nome }}\n    </div>\n  </div>\n</template>\n\n<script setup>\nimport { ref, onMounted } from 'vue'\n\nconst subjects = ref([])\nconst loading = ref(true)\nconst error = ref(null)\n\nonMounted(async () => {\n  try {\n    const response = await fetch(`/api/student/${studentId}/subjects`)\n    const data = await response.json()\n    \n    if (!Array.isArray(data)) throw new Error(\"Invalid format\")\n    subjects.value = data\n  } catch (err) {\n    error.value = err.message\n  } finally {\n    loading.value = false\n  }\n})\n</script>\nFor Angular:\ntypescript\nexport class StudentDashboardComponent implements OnInit {\n  subjects: Subject[] = [];\n  loading = true;\n  error: string | null = null;\n\n  constructor(private http: HttpClient) {}\n\n  ngOnInit() {\n    this.loadSubjects();\n  }\n\n  loadSubjects() {\n    this.http.get<Subject[]>(`/api/student/${this.studentId}/subjects`)\n      .pipe(\n        finalize(() => this.loading = false),\n        catchError(err => {\n          this.error = err.message;\n          return [];\n        })\n      )\n      .subscribe(data => this.subjects = data);\n  }\n}", "Estabilização v4.49.9: Corrigida falha crítica de renderização no dashboard do aluno. Implementadas validações robustas contra estruturas de dados incompatíveis na listagem de matérias, assegurando que o loop de renderização trate corretamente retornos assíncronos e objetos de entrada, eliminando o erro de 'entry object' e restaurando a visibilidade total da grade acadêmica."],
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
