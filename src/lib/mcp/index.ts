import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listApostilas from "./tools/list-apostilas";
import getApostila from "./tools/get-apostila";
import listUpcomingExams from "./tools/list-upcoming-exams";
import listAnnouncements from "./tools/list-announcements";
import listFreeCourses from "./tools/list-free-courses";
import listMyFlashcards from "./tools/list-my-flashcards";
import createFlashcard from "./tools/create-flashcard";
import myProgress from "./tools/my-progress";

// Direct Supabase issuer built from the project ref (import-safe).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "decode-analytics-mcp",
  title: "Decode Analytics Academy",
  version: "0.1.0",
  instructions:
    "Ferramentas do Decode Analytics Academy: consulte apostilas publicadas, próximas provas, avisos, cursos gratuitos, seus flashcards e progresso. Use `list_apostilas` para descobrir conteúdo, `get_apostila` para ler o material completo, e `create_flashcard` para salvar cards de estudo. Todas as ações são executadas como o usuário autenticado (RLS aplicado).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listApostilas,
    getApostila,
    listUpcomingExams,
    listAnnouncements,
    listFreeCourses,
    listMyFlashcards,
    createFlashcard,
    myProgress,
  ],
});
