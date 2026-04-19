import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, BookOpen, Library, Layers, Timer, MessageSquare, Search, Sparkles, Camera } from "lucide-react";
import { ActionSheet, type ActionItem } from "@/components/ActionSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { TiraDuvidaDialog } from "@/components/TiraDuvidaDialog";

/**
 * FAB global de ações rápidas — só aparece no mobile, em rotas autenticadas.
 * Esconde automaticamente nas páginas de login/landing/offline.
 */
export function QuickActionsFab() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [tiraDuvidaOpen, setTiraDuvidaOpen] = useState(false);

  const HIDDEN_ROUTES = ["/", "/login", "/reset-password", "/offline"];
  if (!isMobile) return null;
  if (HIDDEN_ROUTES.includes(location.pathname)) return null;

  const actions: ActionItem[] = [
    {
      id: "tira-duvida",
      label: "Tira-dúvida com foto",
      description: "Foto de exercício → IA explica",
      icon: Camera,
      variant: "primary",
      onSelect: () => setTiraDuvidaOpen(true),
    },
    {
      id: "search",
      label: "Buscar",
      description: "Apostilas, materiais, tópicos",
      icon: Search,
      onSelect: () => navigate("/biblioteca"),
    },
    {
      id: "library",
      label: "Biblioteca",
      description: "Todos os materiais",
      icon: Library,
      onSelect: () => navigate("/biblioteca"),
    },
    {
      id: "materials",
      label: "Materiais",
      description: "PDFs, vídeos, áudios",
      icon: BookOpen,
      onSelect: () => navigate("/materials"),
    },
    {
      id: "community",
      label: "Comunidade",
      description: "Posts e discussões",
      icon: MessageSquare,
      onSelect: () => navigate("/comunidade"),
    },
    {
      id: "dashboard",
      label: "Pomodoro & Flashcards",
      description: "Voltar ao dashboard",
      icon: Timer,
      onSelect: () => {
        navigate("/dashboard");
        setTimeout(() => {
          document
            .querySelector('[class*="GamificationWidget"], [class*="PomodoroTimer"]')
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      },
    },
  ];

  return (
    <>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title="Ações rápidas"
        description="Atalhos para o que você usa mais"
        actions={actions}
        trigger={
          <button
            type="button"
            aria-label="Ações rápidas"
            className="fixed z-40 bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] left-4 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center transition-all duration-300 hover:brightness-110 active:scale-90 animate-soft-glow"
          >
            <Sparkles className="h-6 w-6" />
          </button>
        }
      />
      <TiraDuvidaDialog open={tiraDuvidaOpen} onOpenChange={setTiraDuvidaOpen} />
    </>
  );
}
