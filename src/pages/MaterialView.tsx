import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLog } from "@/hooks/useActivityLog";
import { Watermark } from "@/components/Watermark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function MaterialView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const { data: material, isLoading } = useQuery({
    queryKey: ["material", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("materials")
        .select("*, categories(name)")
        .eq("id", id!)
        .single();
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (material?.file_path) {
      supabase.storage
        .from("materials")
        .createSignedUrl(material.file_path, 300)
        .then(({ data }) => {
          if (data?.signedUrl) setSignedUrl(data.signedUrl);
        });
    }
  }, [material?.file_path]);

  useEffect(() => {
    if (material && user) {
      logActivity("view", material.id);
    }
  }, [material?.id]);

  const handleDownload = async () => {
    if (!material?.file_path || !user) return;

    const { data } = await supabase.storage
      .from("materials")
      .createSignedUrl(material.file_path, 60);

    if (data?.signedUrl) {
      logActivity("download", material.id);
      await supabase.from("downloads").insert({
        user_id: user.id,
        material_id: material.id,
      });

      window.open(data.signedUrl, "_blank");
      toast.success("Download iniciado!");
    } else {
      toast.error("Erro ao gerar link de download.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-primary">Carregando material...</div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Material não encontrado.</p>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  const showWatermark = ["pdf", "image", "video", "exam", "powerpoint", "word", "excel", "gif"].includes(material.type);

  const renderContent = () => {
    if (material.type === "link" && material.file_url) {
      return (
        <div className="text-center py-12">
          <a href={material.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline text-lg">
            <ExternalLink className="h-5 w-5" /> Abrir Link Externo
          </a>
        </div>
      );
    }

    if (material.type === "video" && signedUrl) {
      return (
        <div className="relative select-none">
          <video controls controlsList="nodownload nofullscreen" className="w-full rounded-lg max-h-[70vh] bg-black" onContextMenu={(e) => e.preventDefault()}>
            <source src={signedUrl} />
          </video>
        </div>
      );
    }

    if (material.type === "audio" && signedUrl) {
      return (
        <div className="py-8">
          <audio controls controlsList="nodownload" className="w-full" onContextMenu={(e) => e.preventDefault()}>
            <source src={signedUrl} />
          </audio>
        </div>
      );
    }

    if (material.type === "image" && signedUrl) {
      return (
        <div className="flex justify-center py-4 select-none">
          <img src={signedUrl} alt={material.title} className="max-w-full max-h-[70vh] rounded-lg" onContextMenu={(e) => e.preventDefault()} draggable={false} />
        </div>
      );
    }

    if ((material.type === "pdf" || material.type === "exam") && signedUrl) {
      return (
        <div className="relative select-none">
          <iframe src={`${signedUrl}#toolbar=0&navpanes=0`} className="w-full h-[70vh] rounded-lg border border-border" title={material.title} />
        </div>
      );
    }

    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Visualização não disponível para este tipo de conteúdo.</p>
        {material.file_path && (
          <Button onClick={handleDownload} className="mt-4">
            <Download className="mr-2 h-4 w-4" /> Baixar Material
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto relative px-4">
      {showWatermark && <Watermark />}

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {material.file_path && material.type !== "link" && (
          <Button size="sm" onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Baixar
          </Button>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{material.title}</h1>
          <Badge variant="secondary" className="text-xs shrink-0">{material.type.toUpperCase()}</Badge>
        </div>
        {material.description && <p className="text-muted-foreground text-sm">{material.description}</p>}
        <p className="text-xs text-muted-foreground mt-1">{(material.categories as any)?.name || "Sem categoria"}</p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden select-none">
        {renderContent()}
      </div>
    </div>
  );
}
