import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Image, Video, Headphones, Presentation, Link as LinkIcon, BookOpen, Play, Info } from "lucide-react";
import { TermsDialog } from "@/components/TermsDialog";

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText, image: Image, video: Video, audio: Headphones,
  powerpoint: Presentation, word: FileText, excel: FileText, gif: Image,
  link: LinkIcon, exam: BookOpen, other: FileText,
};

const typeLabels: Record<string, string> = {
  pdf: "PDF", image: "Imagem", video: "Vídeo", audio: "Áudio",
  powerpoint: "PPT", word: "Word", excel: "Excel", gif: "GIF",
  link: "Link", exam: "Simulado", other: "Arquivo",
};

const typeGradients: Record<string, string> = {
  pdf: "from-red-900/90 to-red-950/90",
  image: "from-emerald-900/90 to-emerald-950/90",
  video: "from-blue-900/90 to-blue-950/90",
  audio: "from-amber-900/90 to-amber-950/90",
  powerpoint: "from-orange-900/90 to-orange-950/90",
  word: "from-blue-800/90 to-blue-950/90",
  excel: "from-green-900/90 to-green-950/90",
  gif: "from-pink-900/90 to-pink-950/90",
  link: "from-violet-900/90 to-violet-950/90",
  exam: "from-rose-900/90 to-rose-950/90",
  other: "from-slate-800/90 to-slate-950/90",
};

interface ContentCardProps {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  categoryName?: string;
}

export function ContentCard({ id, title, type, description, categoryName }: ContentCardProps) {
  const navigate = useNavigate();
  const [showTerms, setShowTerms] = useState(false);

  const Icon = typeIcons[type] || FileText;
  const label = typeLabels[type] || type;
  const gradient = typeGradients[type] || "from-slate-800/90 to-slate-950/90";

  return (
    <>
      <div className="netflix-card flex-shrink-0 w-[calc(100%/2.3)] sm:w-[calc(100%/3.3)] md:w-[calc(100%/4.3)] lg:w-[calc(100%/5.3)] xl:w-[calc(100%/6.3)] cursor-pointer group relative rounded-sm overflow-hidden">
        <div
          onClick={() => setShowTerms(true)}
          className={`aspect-video bg-gradient-to-br ${gradient} relative flex flex-col justify-between`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-foreground/20" />
          </div>
          <div className="relative z-10 p-2 sm:p-3">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-foreground/70">
              {label}
            </span>
          </div>
          <div className="relative z-10 p-2 sm:p-3 bg-gradient-to-t from-black/70 to-transparent">
            <h3 className="text-foreground font-semibold text-[11px] sm:text-xs leading-snug line-clamp-2">
              {title}
            </h3>
          </div>
        </div>

        <div className="absolute left-0 right-0 bottom-0 translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-300 delay-300 bg-card rounded-b-sm shadow-2xl shadow-black/80 z-30 border-t-0">
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTerms(true)}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-foreground flex items-center justify-center hover:bg-foreground/80 transition-colors"
              >
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-background fill-background ml-0.5" />
              </button>
              <button
                onClick={() => setShowTerms(true)}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-muted-foreground/50 flex items-center justify-center hover:border-foreground transition-colors"
              >
                <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-foreground" />
              </button>
            </div>
            {categoryName && (
              <p className="text-[10px] text-muted-foreground">{categoryName}</p>
            )}
            {description && (
              <p className="text-[10px] sm:text-[11px] text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
        </div>
      </div>

      <TermsDialog
        open={showTerms}
        materialTitle={title}
        onAccept={() => { setShowTerms(false); navigate(`/material/${id}`); }}
        onDecline={() => setShowTerms(false)}
      />
    </>
  );
}
