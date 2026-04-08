import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentRow } from "@/components/ContentRow";
import { Play, Info, Library } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TermsDialog } from "@/components/TermsDialog";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);
  const [heroMaterialTitle, setHeroMaterialTitle] = useState("");
  const [heroMaterialId, setHeroMaterialId] = useState("");

  const { data: materials } = useQuery({
    queryKey: ["all-materials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("materials")
        .select("*, categories(name, slug)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      return data || [];
    },
  });

  const materialsByCategory = (categories || []).map((cat) => ({
    ...cat,
    materials: (materials || []).filter((m: any) => (m.categories as any)?.slug === cat.slug),
  })).filter((cat) => cat.materials.length > 0);

  const exams = (materials || []).filter((m: any) => m.type === "exam");
  const videos = (materials || []).filter((m: any) => m.type === "video");
  const audios = (materials || []).filter((m: any) => m.type === "audio");
  const recent = (materials || []).slice(0, 15);

  const hero = materials?.[0];

  const handleHeroPlay = () => {
    if (hero) {
      setHeroMaterialTitle(hero.title);
      setHeroMaterialId(hero.id);
      setShowTerms(true);
    }
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      <div className="relative h-[56vw] max-h-[85vh] min-h-[300px] bg-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 netflix-vignette" />
        <div className="absolute inset-0 netflix-vignette-left" />

        <div className="absolute bottom-[15%] sm:bottom-[20%] left-[3.5%] z-10 max-w-lg sm:max-w-xl">
          <p className="text-primary text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] mb-2 sm:mb-3">
            DECODE ANALYTICS ACADEMY
          </p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] mb-3 sm:mb-4">
            {hero ? hero.title : `Bem-vindo, ${profile?.full_name || "Aluno"}`}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-foreground/70 line-clamp-3 mb-4 sm:mb-6 max-w-md">
            {hero?.description || "Acesse simulados, provas, vídeo-aulas, áudios de aulas gravadas e materiais exclusivos."}
          </p>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleHeroPlay}
              className="flex items-center gap-1.5 sm:gap-2 bg-foreground hover:bg-foreground/80 text-background font-bold text-xs sm:text-sm px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-sm transition-colors"
            >
              <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
              Acessar
            </button>
            <button
              onClick={() => navigate("/biblioteca")}
              className="flex items-center gap-1.5 sm:gap-2 bg-muted-foreground/30 hover:bg-muted-foreground/20 text-foreground font-bold text-xs sm:text-sm px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-sm transition-colors backdrop-blur-sm"
            >
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
              Biblioteca
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-4 -mt-16 sm:-mt-24 relative z-10">
        {recent.length > 0 && <ContentRow title="Adicionados Recentemente" materials={recent} />}
        {exams.length > 0 && <ContentRow title="Simulados e Provas" materials={exams} />}
        {videos.length > 0 && <ContentRow title="Vídeo-Aulas" materials={videos} />}
        {audios.length > 0 && <ContentRow title="Áudios de Aulas Gravadas" materials={audios} />}
        {materialsByCategory.map((cat) => (
          <ContentRow key={cat.id} title={cat.name} materials={cat.materials} />
        ))}
        {(!materials || materials.length === 0) && (
          <div className="text-center py-24 px-6">
            <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum material disponível</h3>
            <p className="text-muted-foreground text-sm">Os materiais aparecerão aqui quando forem adicionados.</p>
          </div>
        )}
      </div>

      <TermsDialog
        open={showTerms}
        materialTitle={heroMaterialTitle}
        onAccept={() => { setShowTerms(false); navigate(`/material/${heroMaterialId}`); }}
        onDecline={() => setShowTerms(false)}
      />
    </div>
  );
}
