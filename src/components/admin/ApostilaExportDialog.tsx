import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, FileType2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { parseApostilaContent } from "@/lib/apostila-parser";
import { exportApostilaToPDF } from "@/lib/apostila-pdf";
import { exportApostilaToDOCX } from "@/lib/apostila-docx";

interface Apostila {
  id: string;
  title: string;
  category: string;
  content: string | null;
}

interface Props {
  apostila: Apostila | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Modal de exportação de apostila em PDF ou DOCX.
 * Reaproveita o parser existente e as libs client-side.
 * Estados cobertos: idle, loading, sucesso (toast), erro (toast).
 */
export function ApostilaExportDialog({ apostila, open, onOpenChange }: Props) {
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);

  if (!apostila) return null;

  const run = async (kind: "pdf" | "docx") => {
    if (!apostila.content || !apostila.content.trim()) {
      toast.error("Esta apostila não tem conteúdo para exportar.");
      return;
    }
    setBusy(kind);
    const tId = toast.loading(`Gerando ${kind.toUpperCase()} de "${apostila.title}"…`);
    try {
      const sections = parseApostilaContent(apostila.content).map((s) => ({
        id: s.id, title: s.title, level: s.level, content: s.content,
      }));
      if (kind === "pdf") {
        await exportApostilaToPDF({ title: apostila.title, category: apostila.category, sections });
      } else {
        await exportApostilaToDOCX({ title: apostila.title, category: apostila.category, sections });
      }
      toast.success(`${kind.toUpperCase()} gerado com sucesso`, { id: tId });
      onOpenChange(false);
    } catch (e: any) {
      console.error(`Export ${kind} error`, e);
      toast.error(e?.message || `Falha ao gerar ${kind.toUpperCase()}`, { id: tId });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!busy ? onOpenChange(v) : null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar apostila</DialogTitle>
          <DialogDescription className="line-clamp-2">
            "{apostila.title}" — escolha o formato de exportação.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 hover:border-primary/50"
            disabled={!!busy}
            onClick={() => run("pdf")}
          >
            {busy === "pdf" ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5 text-primary" />}
            <span className="text-sm font-medium">PDF</span>
            <span className="text-[10px] text-muted-foreground">Impressão A4 · imagens</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2 hover:border-primary/50"
            disabled={!!busy}
            onClick={() => run("docx")}
          >
            {busy === "docx" ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileType2 className="h-5 w-5 text-primary" />}
            <span className="text-sm font-medium">DOCX</span>
            <span className="text-[10px] text-muted-foreground">Word · Google Docs</span>
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          O arquivo é gerado no navegador. Documentos longos podem demorar alguns segundos.
        </p>
      </DialogContent>
    </Dialog>
  );
}
